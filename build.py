"""Build public/index.html from src/canvas_src.html.

- Embeds the LeetCode problem list (data/problems.csv) into /*PROBLEMS*/[]
- Embeds UI translations (i18n/<lang>.json, keys = Traditional Chinese source strings) into /*I18N*/{}
- Embeds the vendored Prism syntax highlighter into /*HIGHLIGHTER*/
- Embeds MathLive, formula editing code, styles and mathematical fonts

Usage: python3 build.py
"""
import base64, csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'hi']

probs = []
with open(os.path.join(HERE, 'data', 'problems.csv'), encoding='utf-8') as f:
    for r in csv.DictReader(f):
        probs.append([int(r['id']), r['title'], r['slug'], r['difficulty']])
probs.sort()

src = open(os.path.join(HERE, 'src', 'canvas_src.html'), encoding='utf-8').read()
assert '/*PROBLEMS*/[]' in src and '/*I18N*/{}' in src and '/*HIGHLIGHTER*/' in src
page = src.replace('/*PROBLEMS*/[]', json.dumps(probs, ensure_ascii=False, separators=(',', ':')))
highlighter = open(os.path.join(HERE, 'src', 'vendor', 'prism-1.30.0.min.js'), encoding='utf-8').read()
page = page.replace('/*HIGHLIGHTER*/', highlighter.replace('</script', '<\\/script'))

# Bundle the visual formula editor and its fonts; the output stays self-contained.
math_dir = os.path.join(HERE, 'src', 'vendor', 'mathlive')
math_js = open(os.path.join(math_dir, 'mathlive.min.js'), encoding='utf-8').read()
math_license = open(os.path.join(math_dir, 'LICENSE.txt'), encoding='utf-8').read()
math_js = '\n'.join(line.rstrip() for line in math_js.split('\n'))
math_license = '\n'.join(line.rstrip() for line in math_license.split('\n'))
math_css = open(os.path.join(math_dir, 'mathlive-static.css'), encoding='utf-8').read()
def embed_font(match):
    with open(os.path.join(math_dir, match[1]), 'rb') as f:
        return 'url(data:font/woff2;base64,' + base64.b64encode(f.read()).decode('ascii') + ')'
math_css = re.sub(r'url\((fonts/[^)]+\.woff2)\)', embed_font, math_css)
for marker in ('/*MATHLIVE_JS*/', '/*MATHLIVE_CSS*/', '/*FORMULAS*/'):
    assert marker in page
page = page.replace('/*MATHLIVE_JS*/', ('/*! MathLive license\n' + math_license + '\n*/\n' + math_js).replace('</script', '<\\/script'))
page = page.replace('/*MATHLIVE_CSS*/', math_css)
page = page.replace('/*FORMULAS*/', open(os.path.join(HERE, 'src', 'formulas.js'), encoding='utf-8').read())

keys = json.load(open(os.path.join(HERE, 'i18n', 'source_zh-TW.json'), encoding='utf-8'))
i18n = {}
for lang in LANGS:
    d = json.load(open(os.path.join(HERE, 'i18n', lang + '.json'), encoding='utf-8'))
    missing = [k for k in keys if k not in d]
    if missing:
        print(f'[{lang}] missing {len(missing)} keys, e.g. {missing[:3]}')
    i18n[lang] = {k: v for k, v in d.items() if k in keys and v}
page = page.replace('/*I18N*/{}', json.dumps(i18n, ensure_ascii=False, separators=(',', ':')))

body = page.replace('<meta charset="utf-8">\n', '')
cut = body.index('</style>') + len('</style>')
html = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + body[:cut] +
        '\n</head>\n<body>\n' + body[cut:] + '\n</body>\n</html>\n')
os.makedirs(os.path.join(HERE, 'public'), exist_ok=True)
open(os.path.join(HERE, 'public', 'index.html'), 'w', encoding='utf-8').write(html)
print(f'{len(probs)} problems, {len(i18n)} translations, {round(len(html) / 1024)} KB -> public/index.html')
