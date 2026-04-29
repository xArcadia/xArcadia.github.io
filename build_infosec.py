"""
Build final infosec.js data file from parsed JSON.
Applies manual corrections for the 15 red-answer questions.
"""
import json

# Manual corrections for red-answer questions (searched online)
# Format: question_id -> correct_option_index (0-based)
CORRECTIONS = {
    # "messages not intercepted or altered during transmission" → Integrity
    "22830759": 2,  # C. Integrity
    # "message transmission intended for a recipient only" → Asymmetric encryption
    "22830767": 0,  # A. Asymmetric encryption
    # "masquerade as a senior player, directly target senior" → whaling (same as green in other Q)
    "22830784": 3,  # D. whaling
    # "difficult to detect, network transmissions appear normal" → Eavesdropping Attacks
    "22830804": 1,  # B. Eavesdropping Attacks
    # "troublesome to distinguish, transmissions appear working regularly" → Eavesdropping Attacks
    "22830805": 3,  # D. Eavesdropping Attacks
    # "takes advantage of capacity limits of network resources" → DDoS
    "22830812": 0,  # A. Distributed denial of service
    # "growing issue for PC users and organizations" → Data theft
    "22830850": 1,  # B. Data theft
    # "does not corrupt or modify files" → Worms
    "22830854": 1,  # B. Worms
    # "intercept HTTP POST, change field from 3 to 30" → Proxy
    "22830862": 2,  # C. Proxy
    # "characterizes account limits for users of resources" → Audit policy
    "22876650b": 1,  # B. Audit policy  -- we'll match by question text instead
    # "install additional software, redirect browser, change home page" → Spyware
    "22830856": 0,  # A. Spyware
    # "availability of data refer to" → A. available to people who need it, when they need it
    "22876677": 0,  # A
    # "identifying groups and individuals who need to change" → Organizational change management
    "22876682": 3,  # D. Organizational change management
    # "quality or state of being exposed to possibility of being attacked" → Vulnerability
    "22876688": 3,  # D. Vulnerability (standard definition)
    # "attacker subtly relays and modifies communications between two parties" → Man-in-the-Middle
    "22876691": 1,  # B. Man-in-the-Middle Attacks
}

# Corrections by question text substring (more reliable than IDs since IDs might not match perfectly)
TEXT_CORRECTIONS = {
    "messages are not intercepted or altered during transmission": 2,  # Integrity
    "enable security during the process of message transmission when the message is intended for a recipient only": 0,  # Asymmetric encryption
    "masquerade as a senior player at an organization and directly target senior": 3,  # whaling
    "difficult to detect because the network transmissions will appear to be operating normally": 1,  # Eavesdropping
    "troublesome to distinguish since the network transmissions will show up to be working regularly": 3,  # Eavesdropping
    "takes advantage of the specific capacity limits that apply to any network resources": 0,  # DDoS
    "developing issue for person computer clients as well as huge organizations": 1,  # Data theft
    "does not corrupt or modify files on a target computer": 1,  # Worms
    "intercept the HTTP POST command and change the field from 3 coupons to 30": 2,  # Proxy
    "characterizes account limits for a set of clients of one or more assets": 1,  # Audit policy
    "install additional software, which can redirect your web browser to other sites or change your home page": 0,  # Spyware
    "What does availability of data refer to": 0,  # Available to people who need it
    "recognizing the bunches and individuals who will have to be compelled to alter as the result of the project": 3,  # Organizational CM
    "quality or state of being uncovered to the plausibility of being assaulted or hurt": 3,  # Vulnerability
    "subtly transfers and conceivably modifies the communications between two parties": 1,  # MitM
}

def apply_corrections(questions):
    corrected = 0
    for q in questions:
        if q['correct_index'] >= 0:
            continue  # Already has correct answer
        
        # Try to match by question text
        for text_key, correct_idx in TEXT_CORRECTIONS.items():
            if text_key.lower() in q['question'].lower():
                if correct_idx < len(q['options']):
                    q['correct_index'] = correct_idx
                    corrected += 1
                    break
        
        # If still no correct answer, try by ID
        if q['correct_index'] < 0 and q['id'] in CORRECTIONS:
            idx = CORRECTIONS[q['id']]
            if idx < len(q['options']):
                q['correct_index'] = idx
                corrected += 1
    
    return corrected

def escape_js(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ').replace('\r', '')

def generate_js(questions, output_file):
    lines = []
    lines.append("/* Information Security Reviewer - FA1 & FA2 */")
    lines.append("const INFOSEC_QUESTIONS = [")
    
    for i, q in enumerate(questions):
        if q['correct_index'] < 0:
            print(f"  WARNING: Q{i+1} still has no correct answer: {q['question'][:60]}...")
            q['correct_index'] = 0  # fallback
        
        opts = ', '.join(f"'{escape_js(o)}'" for o in q['options'])
        qtext = escape_js(q['question'])
        lines.append(f"  {{ id: {i+1}, question: '{qtext}', options: [{opts}], answer: {q['correct_index']} }},")
    
    lines.append("];")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    
    print(f"Generated {output_file} with {len(questions)} questions")

def main():
    with open('infosec_parsed.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    print(f"Loaded {len(questions)} questions")
    
    n = apply_corrections(questions)
    print(f"Applied {n} corrections")
    
    still_missing = sum(1 for q in questions if q['correct_index'] < 0)
    if still_missing:
        print(f"WARNING: {still_missing} questions still missing correct answer")
        for q in questions:
            if q['correct_index'] < 0:
                print(f"  ID={q['id']}: {q['question'][:80]}...")
    
    generate_js(questions, 'infosec_questions.js')

if __name__ == "__main__":
    main()
