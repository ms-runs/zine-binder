# Zine binder

An interactive binder of single-sheet photo zines for migsousa.com. Zines sit in clear plastic
pockets; pick one and it slides out of its sleeve, then you flip through it page by page.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

- `index.html`, `binder.css`, `binder.js`: the page
- `zines.js`: one entry per zine (id, title, subtitle, 14 panel images)
- `assets/<id>/`: the cut panels (`00.jpg` front cover, `01`-`12` pages, `13` back cover) and `cover-thumb.jpg`
- `tools/cut_panels.py`: cuts a finished zine PDF into panels and adds it to `zines.js`
- `squarespace-embed.html`: iframe snippet for the Squarespace page

## Preview locally

    python3 -m http.server 8000

then open http://localhost:8000. A link like `/#sevilla-october` opens that zine directly.

## Add a zine

Needs `pdftoppm` (poppler) and Pillow. Use the Letter PDF with two pages (Side A, then Side B):

    python3 tools/cut_panels.py path/to/zine_letter.pdf rome-november "Rome" "November"

Commit the new `assets/rome-november/` folder and the updated `zines.js`. The binder shows twelve
pockets; the unused ones stay empty.

## Share it

GitHub Pages is free for public repositories only. A private repository needs a paid GitHub plan
for Pages. To embed the binder in Squarespace, either make the repository public or use a plan
that supports Pages on private repositories, then:

1. Settings > Pages > deploy from the `main` branch, `/ (root)`.
2. Paste `squarespace-embed.html` into a Code Block, with your username in the `src`.

Notes: Proxima Nova on migsousa.com is loaded from Adobe Fonts for that domain only, so inside an
iframe the binder uses Helvetica Neue, the site's own fallback. The viewer fills the iframe, not the
whole browser window.
