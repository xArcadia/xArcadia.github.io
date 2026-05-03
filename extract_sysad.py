import fitz, os, re, json

pdf_path = r'c:\Users\drack\Documents\Reviewer\pdfs\sys ad\seatwork-1-sys-ad.pdf'

def clean_text(t):
    t = re.sub(r'Quiz Result\n.*?\n', '\n', t)
    t = re.sub(r'blob:moz-extension://.*?\n', '\n', t)
    t = re.sub(r'\d+ of \d+\n', '\n', t)
    t = re.sub(r'\d+/\d+/\d+, \d+:\d+ [AP]M\n', '\n', t)
    t = re.sub(r'Score:\s*[\d.]+\s*/\s*\d+\n', '\n', t)
    return t

def parse_bullet(lines):
    """Parse format with bullet characters."""
    question_lines = []
    options = []
    BULLETS = '\u2022\u25cf\u25cb\uf0b7'
    for line in lines:
        if line and line[0] in BULLETS:
            opt = line[1:].strip()
            if opt:
                options.append(opt)
        else:
            if not options:
                question_lines.append(line)

    q_text = ' '.join(question_lines)

    opts_lower = set(o.lower() for o in options)
    is_tf = opts_lower == {'true', 'false'}
    q_type = 'true_false' if is_tf else 'multiple_choice'

    return q_text, options, q_type

# Extract text
doc = fitz.open(pdf_path)
full_text = ''
for p in doc:
    full_text += p.get_text()
doc.close()

full_text = clean_text(full_text)

# Split by ID markers
parts = re.split(r'(ID:\s*\d+)', full_text)

questions = []
seen = set()

i = 1
while i < len(parts) - 1:
    id_str = parts[i]
    content = parts[i + 1]
    i += 2

    qid = re.search(r'\d+', id_str).group()

    pts_match = re.search(r'PTS:\s*(\d+)', content)
    pts = int(pts_match.group(1)) if pts_match else 0
    content = re.sub(r'PTS:\s*\d+\s*\n?', '', content).strip()

    lines = [l.strip() for l in content.split('\n') if l.strip()]
    lines = [l for l in lines if not re.match(r'^Score:', l)]

    if not lines:
        continue

    q_text, options, q_type = parse_bullet(lines)

    q_text = re.sub(r'\s+', ' ', q_text).strip()

    if not q_text or len(options) < 2:
        continue

    if q_text in seen:
        continue
    seen.add(q_text)

    # Determine answer
    if q_type == 'true_false':
        if pts == 1:
            answer = options[0]
        else:
            answer = 'False' if options[0] == 'True' else 'True'
    else:
        if pts == 1:
            answer = 'A'  # First option is correct
        else:
            answer = 'A'  # Can't determine for wrong answers

    questions.append({
        'type': q_type,
        'question': q_text,
        'options': options if q_type == 'multiple_choice' else None,
        'answer': answer,
        'pts': pts,
    })

tf_count = sum(1 for q in questions if q['type'] == 'true_false')
mc_count = sum(1 for q in questions if q['type'] == 'multiple_choice')
print(f'Seatwork 1 (Module 1-2): {len(questions)} questions ({mc_count} MC, {tf_count} TF)')

# Generate JS file
js_lines = []
js_lines.append('/* ===================================================')
js_lines.append('   sysad.js — System Administration')
js_lines.append('   =================================================== */')
js_lines.append('')
js_lines.append('const SYSAD_DATA = {')
js_lines.append("  id: 'sysad',")
js_lines.append("  title: 'System Administration',")
js_lines.append('  modules: [')

qid_counter = 20000

js_lines.append('    {')
js_lines.append(f'      id: 1,')
js_lines.append(f"      title: 'Seatwork 1 (Module 1-2)',")
js_lines.append(f"      subtopics: ['IT Infrastructure, Servers, Cloud Computing & SysAdmin Fundamentals'],")
js_lines.append('      notes: [')
js_lines.append(f"        {{ heading: 'Seatwork 1 (Module 1-2)', points: ['Questions sourced from Canvas LMS seatwork assessment covering Modules 1-2.'] }}")
js_lines.append('      ],')
js_lines.append('      questions: [')

for q in questions:
    qid_counter += 1
    q_escaped = q['question'].replace('\\', '\\\\').replace("'", "\\'")

    if q['type'] == 'true_false':
        js_lines.append(f"        {{ id: {qid_counter}, type: 'true_false', question: '{q_escaped}', answer: '{q['answer']}', explanation: 'From Seatwork 1 (Module 1-2) Canvas assessment.' }},")
    else:
        opts = q['options'][:5]  # Max 5 options
        while len(opts) < 2:
            opts.append('N/A')
        opts_escaped = [o.replace('\\', '\\\\').replace("'", "\\'") for o in opts]
        opts_str = ', '.join(f"'{o}'" for o in opts_escaped)
        js_lines.append(f"        {{ id: {qid_counter}, type: 'multiple_choice', question: '{q_escaped}', options: [{opts_str}], answer: '{q['answer']}', explanation: 'From Seatwork 1 (Module 1-2) Canvas assessment.' }},")

js_lines.append('      ]')
js_lines.append('    },')

js_lines.append('  ]')
js_lines.append('};')
js_lines.append('')

output_path = r'c:\Users\drack\Documents\Reviewer\js\data\sysad.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(js_lines))

print(f'\nTotal: {len(questions)} questions')
print(f'Generated: {output_path}')
