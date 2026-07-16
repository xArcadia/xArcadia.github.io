#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
canvas_pdf_to_module.py
=======================
Convert a Canvas "Quiz Result" PDF export into a ready-to-paste JS module block
for the Interactive Reviewer question banks (js/data/<subject>.js).

How Canvas encodes the answers
------------------------------
A Canvas quiz-result print does NOT contain "correct answer" text. Instead it
encodes it by COLOR (which plain-text extraction throws away):

  * GREEN (#0eb800) option text = the CORRECT answer
        ...but it is only drawn on questions the quiz-taker got RIGHT (PTS: 1).
  * RED   (#ff0000) option text = the quiz-taker's WRONG pick (PTS: 0).

Consequence: questions answered WRONG (PTS: 0) do not reveal the correct
answer anywhere on the page, so they cannot be recovered from the PDF. This
tool reports those as "skipped". To recover them, re-take the quiz with a
higher score and export again (a 100% attempt greens every answer).

This approach was validated against the DNS/DHCP export ("Seatwork 4"): the
parser reproduced all 60 answers that were independently known — a perfect
ground-truth match — before it was trusted on other files.

Requirements
------------
    pip install pymupdf        # provides the `fitz` module

Usage
-----
    python tools/canvas_pdf_to_module.py "path/to/Quiz.pdf" \
        --module-id 3 \
        --title "Seatwork 3" \
        --start-id 31001 \
        --explanation "From InfoSec Seatwork 3 Canvas assessment." \
        --subtopics "Data backup & recovery, encryption, security controls (Canvas LMS)" \
        --note "122 questions from the InfoSec Seatwork 3 Canvas assessment." \
        -o seatwork3_module.txt

Then open js/data/<subject>.js and paste the printed block as a new element of
that subject's `modules: [ ... ]` array (add a comma after the previous module).
Pick a --start-id range that doesn't collide with existing question ids, and a
--module-id that is unique within the subject.
"""

import argparse
import json
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF is required:  pip install pymupdf")

GREEN = 0x0EB800   # Canvas "correct answer" color
RED = 0xFF0000     # Canvas "your (wrong) answer" color
LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"]


def parse_pdf(path):
    """Return a list of question dicts parsed from a Canvas quiz-result PDF."""
    doc = fitz.open(path)
    spans = []
    for pi, pg in enumerate(doc):
        for block in pg.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for s in line.get("spans", []):
                    if not s["text"].strip():
                        continue
                    spans.append(dict(pi=pi, y=s["bbox"][1], x=s["bbox"][0],
                                      color=s["color"], size=s["size"],
                                      font=s["font"], text=s["text"]))
    doc.close()

    # Reading order, then cluster spans into visual rows by vertical proximity.
    spans.sort(key=lambda s: (s["pi"], round(s["y"], 1), s["x"]))
    rows, cur = [], []
    for s in spans:
        if cur and (s["pi"] != cur[-1]["pi"] or abs(s["y"] - cur[0]["y"]) > 7):
            rows.append(cur)
            cur = []
        cur.append(s)
    if cur:
        rows.append(cur)
    for r in rows:
        r.sort(key=lambda s: s["x"])

    questions = []
    q = None
    first_bullet = False
    last_opt = None
    for row in rows:
        rowtext = "".join(s["text"] for s in row).strip()
        # Each question block is delimited by an "ID: NNNNN" marker.
        m = re.match(r"ID:\s*(\d+)", rowtext)
        if m:
            if q:
                questions.append(q)
            q = dict(cid=int(m.group(1)), qparts=[], options=[])
            first_bullet = False
            last_opt = None
            continue
        if re.match(r"PTS:", rowtext):
            continue
        if any("TimesNewRoman" in s["font"] for s in row):   # page header/footer
            continue
        if any(s["size"] >= 20 for s in row):                # "Score: N / M"
            continue
        if q is None:
            continue
        bullets = [s for s in row if "Bullet" in s["font"]]
        texts = [s for s in row if "Bullet" not in s["font"] and s["size"] >= 12]
        if not texts and not bullets:
            continue
        txt = " ".join(s["text"].strip() for s in texts).strip()
        is_green = any(s["color"] == GREEN for s in texts)
        if bullets:
            q["options"].append(dict(text=txt, correct=is_green))
            last_opt = q["options"][-1]
            first_bullet = True
        else:
            if not first_bullet:
                q["qparts"].append(txt)          # (multi-line) question text
            elif last_opt is not None:
                last_opt["text"] = (last_opt["text"] + " " + txt).strip()  # wrapped option
                if is_green:
                    last_opt["correct"] = True
    if q:
        questions.append(q)

    out = []
    for q in questions:
        question = re.sub(r"\s+", " ", " ".join(q["qparts"]).strip())
        opts = [re.sub(r"\s+", " ", o["text"]).strip() for o in q["options"]]
        correct_idx = [i for i, o in enumerate(q["options"]) if o["correct"]]
        is_tf = {o.lower() for o in opts} <= {"true", "false"} and len(opts) == 2
        out.append(dict(cid=q["cid"], question=question, options=opts,
                        correct_idx=correct_idx, type="true_false" if is_tf else "multiple_choice"))
    return out


def js(s):
    """A valid JS/JSON string literal (handles quotes, backslashes, unicode)."""
    return json.dumps(s, ensure_ascii=False)


def build_module(questions, module_id, title, start_id, explanation, subtopics, note):
    verified = [q for q in questions if len(q["correct_idx"]) >= 1]
    skipped = [q for q in questions if len(q["correct_idx"]) == 0]

    lines = []
    nid = start_id
    for q in verified:
        if q["type"] == "true_false":
            ans = "True" if q["options"][q["correct_idx"][0]].strip().lower() == "true" else "False"
            lines.append(f"        {{ id: {nid}, type: 'true_false', question: {js(q['question'])}, "
                         f"answer: '{ans}', explanation: {js(explanation)} }},")
        else:
            opts = "[" + ", ".join(js(o) for o in q["options"]) + "]"
            answer = ",".join(LETTERS[i] for i in q["correct_idx"])   # multi-select -> "A,C"
            multi = ", multiSelect: true" if len(q["correct_idx"]) > 1 else ""
            lines.append(f"        {{ id: {nid}, type: 'multiple_choice', question: {js(q['question'])}, "
                         f"options: {opts}, answer: '{answer}'{multi}, explanation: {js(explanation)} }},")
        nid += 1
    if lines:
        lines[-1] = lines[-1].rstrip(",")

    subtopics = subtopics or title
    note = note or f"{len(verified)} questions."
    block = "\n".join([
        "    {",
        f"      id: {module_id},",
        f"      title: {js(title)},",
        f"      subtopics: [{js(subtopics)}],",
        "      notes: [",
        f"        {{ heading: {js(title)}, points: [{js(note)}] }}",
        "      ],",
        "      questions: [",
        *lines,
        "      ]",
        "    }",
    ])
    return block, verified, skipped


def main():
    ap = argparse.ArgumentParser(description="Convert a Canvas quiz-result PDF into a Reviewer module block.")
    ap.add_argument("pdf")
    ap.add_argument("--module-id", type=int, required=True, help="unique module id within the subject")
    ap.add_argument("--title", required=True, help='module title, e.g. "Seatwork 3"')
    ap.add_argument("--start-id", type=int, required=True, help="first question id (must not collide)")
    ap.add_argument("--explanation", default="From Canvas assessment.")
    ap.add_argument("--subtopics", default=None)
    ap.add_argument("--note", default=None)
    ap.add_argument("-o", "--out", default=None, help="write the block to a file (else stdout)")
    args = ap.parse_args()

    questions = parse_pdf(args.pdf)
    block, verified, skipped = build_module(
        questions, args.module_id, args.title, args.start_id,
        args.explanation, args.subtopics, args.note)

    end_id = args.start_id + len(verified) - 1
    print(f"# {args.title}: parsed {len(questions)} | added {len(verified)} "
          f"(ids {args.start_id}-{end_id}) | skipped {len(skipped)} (wrong answers, "
          f"correct choice not shown in PDF)", file=sys.stderr)
    if skipped:
        print("# skipped question ids (Canvas cid): " +
              ", ".join(str(q["cid"]) for q in skipped), file=sys.stderr)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(block)
        print(f"# wrote {args.out}", file=sys.stderr)
    else:
        print(block)


if __name__ == "__main__":
    main()
