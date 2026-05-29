#!/usr/bin/env python3
"""
Cleanup Markdown files: remove trailing whitespace and ensure a single final newline.
Creates a .bak backup for each modified file.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

pattern_trail = re.compile(r"[ \t]+(?=\r?\n)")

changed = []
for p in ROOT.rglob('*.md'):
    try:
        text = p.read_text(encoding='utf-8')
    except Exception:
        continue
    orig = text
    # remove trailing spaces/tabs before line endings
    text = pattern_trail.sub('', text)
    # normalize final newlines: strip trailing whitespace/newlines then add exactly one '\n'
    text = re.sub(r"[ \t\r\n]+\Z", "\n", text)
    if text != orig:
        bak = p.with_suffix(p.suffix + '.bak')
        bak.write_text(orig, encoding='utf-8')
        p.write_text(text, encoding='utf-8')
        changed.append(str(p.relative_to(ROOT)))

if changed:
    print('Modified files:')
    for f in changed:
        print(' -', f)
else:
    print('No changes made.')
