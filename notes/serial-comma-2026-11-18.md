# The serial comma, 18 November 2026

Jack noticed that the lexicon was written without the serial (Oxford) comma and asked for it everywhere: the site and the repository's docs. The rule is in `AGENTS.md`, "English punctuation: the serial comma". This note says what the pass did.

## What was read

A script listed every place where *and*, *or*, or *nor* stood without a comma before it and a comma came earlier in the same stretch of text: 4,971 places in the records (`data/concepts/`), the rulings and the other data files, the site's pages (`src/*.html`), `README.md`, `AGENTS.md`, `docs/`, and `notes/`. Latin, Greek, links, and code were left out of the search.

Each place was read in its sentence and judged, by twelve report-only agents (Claude Opus) working from one set of instructions; the coordinating session read samples of every kind of verdict and applied the result mechanically, a comma at the exact spot and nothing else.

| Verdict | Places |
| --- | ---: |
| A series of three or more: comma added | 1,123 |
| A pair, or a comma there for another reason: left | 3,721 |
| Inside words quoted from someone else, or a title: left | 125 |
| Not prose, or unclear: left | 2 |

The 1,123 commas are in 716 files, 681 of them records. Three more went by hand into page descriptions (`src/page.html`, `src/rulings.html`, and the manifest's description in `scripts/build.py`), which the script could not see.

## What was left alone

- Quotations: Lewis & Short's definitions in quotation marks, titles (de Vaan's *Etymological Dictionary of Latin and the other Italic Languages*), and Jack's own words quoted in the notes.
- Latin: no Latin was repunctuated. The count of linked Latin words was the same before and after.
- Comments in the scripts, the stylesheet, and the tests; and the generated reports under `notes/coverage/`.

## Reviewed records

Before the records changed, Jack's 53 waiting verdicts were applied (40 marked right, 13 flags). The 13 reviewed records the pass touched (a-lot, answer, big, capture-catch, due-owed, ever, fact, house, marbles, pepper-relish, sintra, solve, yum-yum) stayed reviewed, by Jack's decision for this pass: the change is punctuation only and was made at his request. That is not a general exception to the rule under Review in `AGENTS.md`.

## What may be wrong

A judgement was made 4,971 times, so a few will be wrong either way: a comma put before what is really a pair, or a true series passed over as a pair. A series whose earlier items are divided by something other than a comma was not on the list. Correct either kind where it is met.
