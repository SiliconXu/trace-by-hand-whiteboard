# Trace-by-Hand Whiteboard · 手動跑題白板

A digital whiteboard for tracing algorithm problems by hand — drag in arrays, pointers, stacks, queues, dictionaries, sets, trees, linked lists, graphs and tables, then walk through a LeetCode problem step by step before you write code.

一個「寫 code 之前先手動跑一遍」用的數位白板：把陣列、指標、堆疊、佇列、字典、集合、樹、串列、圖、表格拉到畫布上，一步一步把題目跑一遍。

**Live:** https://draw.prod-stack.com

## Features

- Components: title, text, code, sticky note, array, pointer, stack, queue, dictionary, set, 2D array, variable, tree / list / graph nodes, table
- Code: choose Python, JavaScript, TypeScript, Java, C, C++, JSON or plain text; edit source, then click Done, click outside, or press Ctrl/Cmd+Enter to show syntax highlighting. New code blocks default to Python; existing blocks without a language stay plain text.
- Formulas: drag in a blank formula, fraction, root, power, subscript, sum, complexity, recurrence or DP template. Edit visually, nest structures, and copy the LaTeX source. Formulas support font sizes, duplication, connectors, undo/redo and JSON export/import.
- Drawing tools: pen, eraser, rectangle, circle, line, arrow, connectors
- Multi-select, copy/paste, layers, undo/redo, minimap, zoom
- Drag a component or a selection back onto the left component palette to delete it. The palette shows a delete target while hovered; connected edges are removed too. Undo restores the whole deletion, and Escape cancels a drag.
- "My boards": open a board for any LeetCode problem by number or title (3,000+ problems built in)
- Export / import as JSON; everything is saved in your browser (localStorage) — nothing is sent to a server
- 7 languages: 繁體中文, 简体中文, English, 日本語, 한국어, Français, हिन्दी (auto-detected; switch in the top-left, or use `?lang=en`)

## Project structure

```
src/canvas_src.html   # the app (single file: HTML + CSS + JS)
src/formulas.js       # formula templates, visual editor and static rendering
src/vendor/           # Prism 1.30.0 and MathLive 0.111.1 (MIT), with math fonts
i18n/                 # UI translations; keys are the Traditional Chinese source strings
data/problems.csv     # LeetCode problem list (id, title, slug, difficulty)
build.py              # builds public/index.html (embeds problems + translations)
public/index.html     # built, self-contained page
wrangler.jsonc        # Cloudflare Workers static-assets deploy config
```

## Build & deploy

```bash
python3 build.py          # -> public/index.html
npx wrangler deploy       # deploy to Cloudflare (needs your own account / domain)
```

Opening `public/index.html` directly in a browser also works.

Code highlighting uses [PrismJS](https://prismjs.com/) 1.30.0, vendored from its official release with its MIT license included. The build embeds the core and the clike, JavaScript, TypeScript, Python, Java, C, C++ and JSON grammars, so highlighting works offline without a CDN or an npm install.

Formula editing uses [MathLive](https://mathlive.io/mathfield/) 0.111.1 from its official npm package. Its script, static styles, fonts and MIT license are embedded at build time, so the generated HTML also supports visual formula editing offline.

## Formula editing

- Search for “公式” (or “formula”) in the component palette to show the formula cards. Click a card to insert it in the center, or drag it to a position on the board.
- In the visual editor, use the fraction, root, power, subscript, sum and parentheses buttons. Selected content becomes part of the inserted structure. Tab moves between placeholders; multi-digit superscripts and subscripts are supported.
- Click Done or press Ctrl/Cmd+Enter to save. Cancel or Escape discards edits. Double-click a formula, press Enter while it is focused, or use its floating Edit formula button to reopen it.
- The editor also has a LaTeX source panel, a Copy LaTeX button and a font size selector. The floating toolbar can copy the source and adjust font size without opening the editor.
- Boards store the LaTeX source and font size, so formulas remain editable after reload, duplication or JSON export/import.

## Adding UI text

Wrap any new user-facing string in `_T('…')` in `src/canvas_src.html`, add the same key to `i18n/source_zh-TW.json`, and add translations to each `i18n/<lang>.json`.

---

LeetCode is a trademark of LeetCode LLC. This project is not affiliated with LeetCode; problem titles are only used to link to the original problems.
