# Ultrafilter AI Business Plan Deck

This codebase turns the existing `public/bp_preview.html` into an editable slide deck.

## Run

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4173/
```

## Structure

```text
index.html                 Central HTML shell
src/app.js                 App bootstrap
src/deck/                  Slide navigation, progress, language, PDF export
src/styles/                Shared visual system from design_book.md
src/slides/01-cover/       One independent slide document
src/slides/02-market-shift/
...
src/slides/21-closing/
public/bp_preview.html     Original single-file source, kept as reference
public/design_book.md      Visual system source
```

## Editing A Slide

Each slide owns its own folder:

```text
src/slides/08-product-loop/
  slide.html
  slide.css
```

Use `slide.html` for the page structure and copy. Use `slide.css` only for details unique to that page. Shared tokens, paper texture, typography, components, navigation, and print rules live under `src/styles/`.

## Electronic And PDF Versions

The electronic version uses one active slide at a time with restrained opacity/translate motion.

The PDF version uses the same slide source files. `EXPORT PDF` renders every slide into a fixed `1200px x 675px` canvas and writes those canvases into a generated PDF with matching 16:9 pages. The export path intentionally avoids the browser print dialog because Safari, Chrome, and Firefox can override CSS page size with their own paper settings.

## Language Switching

The deck shell already includes a language controller. For future bilingual copy, wrap alternatives like this:

```html
<span data-lang="zh">中文内容</span>
<span data-lang="en">English content</span>
```

The current migration preserves the existing `bp_preview.html` content first; full English copy can be added slide by slide.
