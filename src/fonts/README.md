# Fonts

The site serves its own fonts, so that pages load without third-party requests and keep working offline.

- `lexicon-serif-*.woff2`: subsets of **Gentium Book Plus** by SIL International (SIL Open Font License 1.1, `OFL-gentium-book-plus.txt`). The subsets keep Latin, Latin Extended (every macron vowel), combining marks, Greek and polytonic Greek, punctuation and arrows, with all OpenType features, including the true small capitals (`smcp`, `c2sc`). The OFL reserves the names "Gentium" and "SIL" and forbids them in modified versions, and subsetting counts as modifying, so the subsets are renamed **Lexicon Serif**.
- `alegreya-sans-*.woff2`: subsets of **Alegreya Sans** by Huerta Tipográfica (SIL Open Font License 1.1, `OFL-alegreya-sans.txt`, no reserved names), weights 400, 500 and 700, for the controls.

The originals came from the [google/fonts](https://github.com/google/fonts) repository (`ofl/gentiumbookplus`, `ofl/alegreyasans`). To regenerate the subsets:

```sh
pip install fonttools brotli
python3 -m fontTools.subset GentiumBookPlus-Regular.ttf --flavor=woff2 --no-hinting --desubroutinize \
  --layout-features='*' --output-file=lexicon-serif-400.woff2 \
  --unicodes='U+0000-00FF,U+0100-024F,U+0300-036F,U+0370-03FF,U+1E00-1EFF,U+1F00-1FFF,U+2000-206F,U+2070-209F,U+20AC,U+2100-214F,U+2190-21FF,U+2212,U+2260-2265'
```

Then set the name table to "Lexicon Serif" (name IDs 1–4 and 6) with fontTools, keeping SIL's copyright and licence records. `scripts/build.py` copies this folder to `assets/fonts/`.
