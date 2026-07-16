# tools/

Local helper scripts for maintaining the question banks. **Not part of the deployed site.**

## `canvas_pdf_to_module.py`

Converts a Canvas **"Quiz Result"** PDF export into a JS module block you can paste
into `js/data/<subject>.js`.

### Why a script (and how answers are recovered)

Canvas quiz-result PDFs don't print the words "correct answer" — they encode it by
**color**, which normal text extraction discards:

| Color | Meaning |
|-------|---------|
| **green** (`#0eb800`) | the **correct** option — but only drawn on questions answered **correctly** (PTS: 1) |
| **red** (`#ff0000`) | the quiz-taker's **wrong** pick (PTS: 0) |

So a question the quiz-taker got **wrong** never shows its correct answer on the page and
**cannot be recovered** from that PDF. The script reports those as *skipped* rather than
guessing. **Fix:** re-take the quiz with a higher score (ideally 100%) and re-export — a
perfect attempt greens every answer.

The parser was validated against the DNS/DHCP export by reproducing all 60 already-known
answers exactly before being trusted on new files.

### Requirements

```bash
pip install pymupdf
```

### Usage

```bash
python tools/canvas_pdf_to_module.py "path/to/Quiz.pdf" \
    --module-id 3 \
    --title "Seatwork 3" \
    --start-id 31001 \
    --explanation "From InfoSec Seatwork 3 Canvas assessment." \
    --subtopics "Data backup & recovery, encryption, security controls (Canvas LMS)" \
    --note "122 questions from the InfoSec Seatwork 3 Canvas assessment." \
    -o module.txt
```

Progress/skip info prints to stderr; the module block prints to stdout (or `-o` file).
Paste the block as a new element of the target subject's `modules: [ ... ]` array.

### Picking ids

- `--module-id` must be unique **within the subject** (it's also the number badge shown on the card).
- `--start-id` must not collide with existing question ids. Current ranges:
  - CSPT: `1xxxx` · SysInteg: various · SysAd: `2xxxx`/`4xxxx`/`5xxxx`/`6xxxx`/`8xxxx` · InfoSec: `3xxxx`

Check with: `grep -oE "id: [0-9]+" js/data/<subject>.js | grep -oE "[0-9]+" | sort -n | tail`
