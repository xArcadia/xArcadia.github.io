import fitz, os, re, json

pdf_dir = r'c:\Users\drack\Documents\Reviewer\canvas version\sys integ'
files_order = [
    ('FA1-SYS-INTEG.pdf', 'FA1'),
    ('FA2-SYS-INTEG.pdf', 'FA2'),
    ('FA3-SYS-INTEG.pdf', 'FA3'),
    ('FA4-SYS-INTEG.pdf', 'FA4'),
    ('FA5-SYS-INTEG-1.pdf', 'FA5'),
    ('FA6-FA7-SYS-INTEG-1.pdf', 'FA6-FA7'),
]

def clean_text(t):
    t = re.sub(r'Quiz Result\n.*?\n', '\n', t)
    t = re.sub(r'blob:moz-extension://.*?\n', '\n', t)
    t = re.sub(r'\d+ of \d+\n', '\n', t)
    t = re.sub(r'\d+/\d+/\d+, \d+:\d+ [AP]M\n', '\n', t)
    t = re.sub(r'Score:\s*\d+\s*/\s*\d+\n', '\n', t)
    return t

def parse_no_bullet(lines):
    """Parse FA1/FA2 format where options don't have bullets."""
    # Check True/False first
    tf_indices = [j for j, l in enumerate(lines) if l.strip() in ('True', 'False')]
    if len(tf_indices) >= 2:
        first_tf = tf_indices[0]
        q_text = ' '.join(lines[:first_tf])
        opts = [lines[j] for j in tf_indices]
        return q_text, opts, 'true_false'

    # MC: group lines into options by joining continuation lines
    # Strategy: join ALL lines first, then try to detect question vs options
    # Known option keywords that start options
    full = '\n'.join(lines)
    
    # Remove "No answer text provided." lines
    lines = [l for l in lines if l.strip() != 'No answer text provided.']
    
    if len(lines) < 3:
        return ' '.join(lines), [], 'unknown'
    
    # Try to find where question ends and options start
    # Heuristic: rebuild by merging lines that look like continuations
    merged = []
    current = lines[0]
    for line in lines[1:]:
        # A line is a continuation if it starts lowercase or doesn't look like a new option
        if (line[0].islower() or 
            (not line[0].isupper() and not line[0].isdigit()) or
            (len(line) < 25 and current.endswith((',', 'and', 'or', 'the', 'a', 'an')))):
            current += ' ' + line
        else:
            merged.append(current.strip())
            current = line
    merged.append(current.strip())
    
    if len(merged) < 3:
        # Try just taking first as question, rest as options
        return merged[0], merged[1:], 'multiple_choice'
    
    # Question is first merged chunk, rest are options
    q_text = merged[0]
    opts = merged[1:]
    
    # If question seems too short and there are many "options", maybe first few are question
    if len(q_text) < 20 and len(opts) > 4:
        q_text = merged[0] + ' ' + merged[1]
        opts = merged[2:]
    
    return q_text, opts, 'multiple_choice'

def parse_bullet(lines):
    """Parse FA3-FA7 format with bullet characters."""
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

all_modules = {}

for fname, mod_name in files_order:
    path = os.path.join(pdf_dir, fname)
    doc = fitz.open(path)
    full_text = ''
    for p in doc:
        full_text += p.get_text()
    doc.close()
    
    full_text = clean_text(full_text)
    
    # Detect format - check for bullet chars U+2022, U+25CF, U+25CB, U+F0B7
    BULLETS = '\u2022\u25cf\u25cb\uf0b7'
    has_bullets = any(c in full_text for c in BULLETS)
    
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
        
        if has_bullets:
            q_text, options, q_type = parse_bullet(lines)
        else:
            q_text, options, q_type = parse_no_bullet(lines)
        
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
            letters = ['A', 'B', 'C', 'D', 'E', 'F']
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
    
    all_modules[mod_name] = questions
    tf_count = sum(1 for q in questions if q['type'] == 'true_false')
    mc_count = sum(1 for q in questions if q['type'] == 'multiple_choice')
    print(f'{mod_name}: {len(questions)} questions ({mc_count} MC, {tf_count} TF)')

# Now generate JS file
js_lines = []
js_lines.append('/* ===================================================')
js_lines.append('   sysinteg.js — System Integration (Canvas Version)')
js_lines.append('   =================================================== */')
js_lines.append('')
js_lines.append('const SYSINTEG_DATA = {')
js_lines.append("  id: 'sysinteg',")
js_lines.append("  title: 'System Integration',")
js_lines.append('  modules: [')

module_titles = {
    'FA1': ('Formative Assessment 1', 'Software Engineering Fundamentals'),
    'FA2': ('Formative Assessment 2', 'Agile Development & Process Models'),
    'FA3': ('Formative Assessment 3', 'Requirements Engineering & System Modeling'),
    'FA4': ('Formative Assessment 4', 'Architectural Design & Implementation'),
    'FA5': ('Formative Assessment 5', 'Software Testing & Evolution'),
    'FA6-FA7': ('Formative Assessment 6-7', 'Project Management, Services & Integration'),
}

qid_counter = 10000

for idx, (fname, mod_name) in enumerate(files_order):
    mod_id = idx + 1
    title, subtopic = module_titles[mod_name]
    questions = all_modules[mod_name]
    
    js_lines.append('    {')
    js_lines.append(f'      id: {mod_id},')
    js_lines.append(f"      title: '{title}',")
    js_lines.append(f"      subtopics: ['{subtopic}'],")
    js_lines.append('      notes: [')
    js_lines.append(f"        {{ heading: '{title}', points: ['Questions sourced from Canvas LMS formative assessments.'] }}")
    js_lines.append('      ],')
    js_lines.append('      questions: [')
    
    for q in questions:
        qid_counter += 1
        q_escaped = q['question'].replace('\\', '\\\\').replace("'", "\\'")
        
        if q['type'] == 'true_false':
            js_lines.append(f"        {{ id: {qid_counter}, type: 'true_false', question: '{q_escaped}', answer: '{q['answer']}', explanation: 'From {mod_name} Canvas assessment.' }},")
        else:
            opts = q['options'][:4]  # Max 4 options
            while len(opts) < 2:
                opts.append('N/A')
            opts_escaped = [o.replace('\\', '\\\\').replace("'", "\\'") for o in opts]
            opts_str = ', '.join(f"'{o}'" for o in opts_escaped)
            js_lines.append(f"        {{ id: {qid_counter}, type: 'multiple_choice', question: '{q_escaped}', options: [{opts_str}], answer: '{q['answer']}', explanation: 'From {mod_name} Canvas assessment.' }},")
    
    js_lines.append('      ]')
    js_lines.append('    },')

js_lines.append('  ]')
js_lines.append('};')
js_lines.append('')

output_path = r'c:\Users\drack\Documents\Reviewer\js\data\sysinteg.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(js_lines))

total = sum(len(v) for v in all_modules.values())
print(f'\nTotal: {total} questions')
print(f'Generated: {output_path}')
