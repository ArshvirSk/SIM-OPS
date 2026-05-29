#!/usr/bin/env python3
"""
Restore Markdown files from .bak backups created by cleanup_md.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
restored = []
for p in ROOT.rglob('*.md.bak'):
    name = p.name
    if not name.endswith('.bak'):
        continue
    orig_name = name[:-4]
    orig_path = p.with_name(orig_name)
    try:
        content = p.read_text(encoding='utf-8')
        orig_path.write_text(content, encoding='utf-8')
        p.unlink()
        restored.append(str(orig_path.relative_to(ROOT)))
    except Exception as e:
        print('Failed to restore', p, e)

if restored:
    print('Restored files:')
    for f in restored:
        print(' -', f)
else:
    print('No .md.bak files found.')
