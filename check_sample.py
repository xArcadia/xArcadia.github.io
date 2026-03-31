import json

with open('sysinteg_parsed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for mod in ['FA1', 'FA2', 'FA3']:
    print(f'\n=== {mod} - first 3 ===')
    for q in data[mod][:3]:
        print(f"  Q: {q['question'][:90]}")
        if q['type'] == 'true_false':
            print(f"  A: {q['answer']}")
        else:
            print(f"  Options: {q['options']}")
            print(f"  A: {q['answer']}")
        print()
