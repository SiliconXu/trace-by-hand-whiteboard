# MathLive 0.111.1

Vendored browser files from the official `mathlive@0.111.1` npm package:
https://registry.npmjs.org/mathlive/-/mathlive-0.111.1.tgz

- `mathlive.min.js`: visual editor and LaTeX rendering
- `mathlive-static.css`: styles for static formula markup, including font faces
- `fonts/*.woff2`: bundled mathematical fonts
- `LICENSE.txt`: upstream MIT license

`build.py` embeds these resources in `public/index.html`, replacing font URLs
with data URLs. No runtime CDN, audio assets or compute engine is required.
