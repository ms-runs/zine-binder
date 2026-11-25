#!/usr/bin/env python3
"""Cut a finished zine PDF into the 14 viewer panels and add it to zines.js.

Usage (run from the zine-binder folder):
    python3 tools/cut_panels.py <letter-pdf> <id> "<Title>" "<Sub>"
    e.g. python3 tools/cut_panels.py ../Zines-2026-Print/09-Rome-November_letter.pdf rome-november "Rome" "November"

Needs poppler's pdftoppm and Pillow. The PDF must be 2 pages: Side A, then Side B.
Each side is a 4x2 grid (index 0-3 top row, 4-7 bottom row). Bottom-row cells are
rotated 180 degrees on the sheet, so they are turned back here. This matches the
FOLD_TEMPLATE in zine-maker/index.html.
Add --no-register to cut the panels without touching zines.js.
"""
import glob, json, os, re, subprocess, sys, tempfile
from PIL import Image

# Reading order as (side, grid index, rotation): front cover, pages 1-12, back cover.
# Side 0 = A (front): 0 glue, 1 p11, 2 p12, 3 front cover, 4 glue, 5 p10, 6 p9, 7 back cover.
# Side 1 = B (back):  0-3 = p1-4, 4 = p8, 5 = p7, 6 = p6, 7 = p5 (bottom row rotated 180).
ORDER = [(0, 3, 0),
         (1, 0, 0), (1, 1, 0), (1, 2, 0), (1, 3, 0),
         (1, 7, 180), (1, 6, 180), (1, 5, 180), (1, 4, 180),
         (0, 6, 180), (0, 5, 180), (0, 1, 0), (0, 2, 0),
         (0, 7, 180)]

def main():
    args = [a for a in sys.argv[1:] if a != '--no-register']
    register = '--no-register' not in sys.argv
    if len(args) != 4:
        sys.exit(__doc__)
    pdf, zid, title, sub = args
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'assets', zid)
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-r', '300', '-jpeg', '-jpegopt', 'quality=92', pdf, os.path.join(tmp, 's')], check=True)
        pages = sorted(glob.glob(os.path.join(tmp, 's-*.jpg')))
        if len(pages) != 2:
            sys.exit('Expected a 2-page PDF (Side A, Side B), got %d pages' % len(pages))
        sides = [Image.open(p).convert('RGB') for p in pages]
    for n, (s, i, rot) in enumerate(ORDER):
        im = sides[s]
        w, h = im.size
        cw, ch = w / 4, h / 2
        c, r = i % 4, i // 4
        panel = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        if rot:
            panel = panel.rotate(180)
        panel = panel.resize((640, 960), Image.LANCZOS)
        panel.save(os.path.join(out, '%02d.jpg' % n), quality=82, optimize=True, progressive=True)
    Image.open(os.path.join(out, '00.jpg')).resize((320, 480), Image.LANCZOS).save(
        os.path.join(out, 'cover-thumb.jpg'), quality=80, optimize=True)
    print('Cut 14 panels into', out)
    if not register:
        return
    path = os.path.join(root, 'zines.js')
    text = open(path).read()
    head = text[:text.index('window.ZINES')]
    data = json.loads(re.search(r'window\.ZINES\s*=\s*(\[.*\]);', text, re.S).group(1))
    entry = {'id': zid, 'title': title, 'sub': sub, 'cover': 'assets/%s/cover-thumb.jpg' % zid,
             'panels': ['assets/%s/%02d.jpg' % (zid, n) for n in range(14)]}
    data = [d for d in data if d['id'] != zid] + [entry]
    open(path, 'w').write(head + 'window.ZINES = ' + json.dumps(data, indent=2) + ';\n')
    print('Registered', zid, 'in zines.js (%d zines)' % len(data))

if __name__ == '__main__':
    main()
