"""
Extract Information Security questions from PDF.
Green font = correct answer
Red font = wrong answer (PTS: 0) — need to find correct via search
"""
import fitz  # PyMuPDF
import json
import re

PDF_PATH = r"pdfs/Information security/info-sec-fa1-fa2.pdf"
OUTPUT_JSON = "infosec_parsed.json"

def extract_lines_with_color(pdf_path):
    """Extract all text lines with their color information."""
    doc = fitz.open(pdf_path)
    all_lines = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                line_spans = []
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    color_int = span["color"]
                    r = ((color_int >> 16) & 0xFF) / 255.0
                    g = ((color_int >> 8) & 0xFF) / 255.0
                    b = (color_int & 0xFF) / 255.0
                    
                    color_name = 'black'
                    if g > 0.4 and r < 0.4 and b < 0.4:
                        color_name = 'green'
                    elif g > r and g > b:
                        color_name = 'green'
                    elif r > 0.5 and g < 0.3 and b < 0.3:
                        color_name = 'red'
                    
                    line_spans.append({'text': text, 'color': color_name})
                
                if line_spans:
                    merged_text = ' '.join(s['text'] for s in line_spans)
                    colors = set(s['color'] for s in line_spans)
                    primary_color = 'black'
                    if 'green' in colors:
                        primary_color = 'green'
                    elif 'red' in colors:
                        primary_color = 'red'
                    
                    all_lines.append({
                        'text': merged_text,
                        'color': primary_color,
                        'page': page_num + 1
                    })
    
    doc.close()
    return all_lines

def is_noise(text):
    """Check if a line is noise/metadata to skip."""
    noise_patterns = [
        r'^Score:',
        r'^Quiz Result',
        r'^blob:',
        r'^\d+ of \d+$',
        r'^\d+/\d+/\d+,\s+\d+:\d+\s+(AM|PM)$',
        r'^4/28/2026',
    ]
    for p in noise_patterns:
        if re.match(p, text.strip()):
            return True
    return False

def parse_questions(lines):
    """Parse extracted lines into structured questions."""
    questions = []
    i = 0
    
    while i < len(lines):
        text = lines[i]['text'].strip()
        
        # Skip noise
        if is_noise(text):
            i += 1
            continue
        
        # Detect question start: "ID: XXXXX"
        id_match = re.match(r'^ID:\s*(\d+)', text)
        if id_match:
            q_id = id_match.group(1)
            i += 1
            
            # Next should be "PTS: X"
            if i < len(lines):
                pts_match = re.match(r'^PTS:\s*(\d+)', lines[i]['text'].strip())
                if pts_match:
                    pts = int(pts_match.group(1))
                    i += 1
                else:
                    pts = -1
            
            # Collect question text (lines until first bullet •)
            q_text_parts = []
            while i < len(lines):
                lt = lines[i]['text'].strip()
                if is_noise(lt):
                    i += 1
                    continue
                if lt.startswith('•') or lt.startswith('\u2022'):
                    break
                if re.match(r'^ID:\s*\d+', lt):
                    break
                q_text_parts.append(lt)
                i += 1
            
            question_text = ' '.join(q_text_parts).strip()
            if not question_text:
                continue
            
            # Collect options (lines starting with •)
            options = []
            correct_idx = -1
            wrong_idx = -1
            
            while i < len(lines):
                lt = lines[i]['text'].strip()
                color = lines[i]['color']
                
                if is_noise(lt):
                    i += 1
                    continue
                
                if re.match(r'^ID:\s*\d+', lt):
                    break
                
                # Check for bullet option
                bullet_match = re.match(r'^[•\u2022]\s*(.*)', lt)
                if bullet_match:
                    opt_text = bullet_match.group(1).strip()
                    if color == 'green':
                        correct_idx = len(options)
                    elif color == 'red':
                        wrong_idx = len(options)
                    options.append(opt_text)
                    i += 1
                elif color == 'green' and not lt.startswith('ID:'):
                    # Continuation of a green option on next line
                    if options:
                        options[-1] += ' ' + lt
                    elif not options:
                        # This is the start of an option without bullet
                        correct_idx = len(options)
                        options.append(lt)
                    i += 1
                elif color == 'red' and not lt.startswith('ID:'):
                    if options:
                        options[-1] += ' ' + lt
                    i += 1
                elif not lt.startswith('ID:') and not lt.startswith('PTS:'):
                    # Continuation of previous option or question
                    if options:
                        options[-1] += ' ' + lt
                    else:
                        q_text_parts.append(lt)
                        question_text = ' '.join(q_text_parts).strip()
                    i += 1
                else:
                    break
            
            if options and question_text:
                q = {
                    'id': q_id,
                    'pts': pts,
                    'question': question_text,
                    'options': options,
                    'correct_index': correct_idx,
                    'wrong_index': wrong_idx if correct_idx == -1 else -1,
                }
                questions.append(q)
        else:
            i += 1
    
    return questions

def main():
    print(f"Extracting from: {PDF_PATH}")
    lines = extract_lines_with_color(PDF_PATH)
    print(f"Total lines: {len(lines)}")
    
    questions = parse_questions(lines)
    print(f"Questions found: {len(questions)}")
    
    # Stats
    correct_count = sum(1 for q in questions if q['correct_index'] >= 0)
    wrong_count = sum(1 for q in questions if q['correct_index'] == -1 and q['wrong_index'] >= 0)
    missing = sum(1 for q in questions if q['correct_index'] == -1 and q['wrong_index'] == -1)
    
    print(f"  With correct answer (green): {correct_count}")
    print(f"  With wrong answer only (red, needs lookup): {wrong_count}")
    print(f"  Missing both: {missing}")
    
    # Print the red-answer questions for manual review
    if wrong_count > 0:
        print(f"\n--- Questions needing correct answer lookup ({wrong_count}) ---")
        for q in questions:
            if q['correct_index'] == -1 and q['wrong_index'] >= 0:
                print(f"\n  Q: {q['question']}")
                for j, opt in enumerate(q['options']):
                    marker = " [WRONG]" if j == q['wrong_index'] else ""
                    print(f"    {chr(65+j)}. {opt}{marker}")
    
    # Save JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
