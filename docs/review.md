# Review

Every record of the lexicon is a draft until the editor has read it and found it right. Agents draft records by the hundred; nothing is reviewed until Jack says so. This is how a record gets from draft to reviewed (Jack, 15 November 2026: "a review process... not just a to-do item, a process", with "a way to give that verdict from the phone in one tap").

Only the editor reviews, and he does not review on the site (Jack, 15 November 2026). He reads the drafts and marks them right in a private page of his own, built by `scripts/editor_review.py`; see "The editor's page" below. The public site offers a reader one thing, the flag, and never prints the reviewer's name. The first version, on the morning of 15 November 2026, had the editor's controls on the site (a "looks right" control, a reviewer's switch and a queue of drafts on `review.html`); they were taken out the same day.

The site is static and has no server. A reader's flags are kept on the reader's device, gathered into one report, and sent; the editor's verdicts come from his page as a report in the same format. An agent applies either to the repository.

## Who does what

1. **Agents draft and pre-check.** A record goes in as a draft (`"review": {"status": "draft", …}`) and must pass the builder's checks, `scripts/check_quantities.py` (vowel lengths against Lewis & Short), `scripts/consonantal_j.py --check` and, for its answer, `scripts/answer_kinds.py`. Quotations are checked against their texts and citations against the place they name (see `docs/drafting.md` and `docs/records.md`). None of this makes a record reviewed.
2. **The editor gives the verdict** in his private page: looks right, or a flag with a few words if he likes. The page writes his verdicts as a report.
3. **A reader flags what looks wrong**, on the entry's page or on the back of a practice card: *Notā* (Flag), with a reason and a few words if he likes. `review.html` gathers the flags not yet sent into a report: Share, Copy or a GitHub issue.
4. **An agent applies a report**, the editor's or a reader's, with `python3 scripts/apply_review.py <file or ->`, rebuilds the site, and commits. Records marked right become reviewed. Flags are written to `notes/review-flags.md`.
5. **An agent acts on each flag**: reads the entry against its sources, corrects it or answers why it stands, and deletes the flag's line. A corrected record has a new revision, so it is a draft to be read again.

Agents never set `review.status` to `reviewed` themselves. Only `scripts/apply_review.py` does, from the editor's report. A report that marks entries right is applied only when it comes from the editor: the site gives a reader no way to make one, but the format is plain text, so look at where a report came from before applying it (Claude's caution, 15 November 2026, not a ruling of Jack's).

## What a review checks

A record is right when:

- **The Latin answers the headword**: it means what the English says, and it is the kind of word the headword is (a noun for a noun), or the gloss says why not.
- **The quantities are right**: every long vowel marked, none marked that is short, consonantal i written j.
- **The status and the period are right**: the recommended word is the one to say; a word marked classical is in a classical author in that sense.
- **Each citation is where it says**: the author, work and place hold the word, in that sense.
- **The example contains the word and means what its English says.**
- **Nothing of ours stands where an attested word exists** (see "Coinages only where needed" in `docs/records.md`).

## What "reviewed" promises, and what it does not

"Reviewed 15 November 2026" at the foot of an entry means that the editor read that text on that day and found nothing wrong by the checks above. It is tied to the text: the verdict is given on a revision of the record and is applied only if the record still has that revision. The line gives the date and no name (Jack, 15 November 2026): the record keeps the reviewer in `review.by`, and the site does not print it.

It does not promise that the entry is beyond improvement, that every quotation was read again in a modern edition (the entry's Sources say what was checked against what), or that a later change was reviewed: a reviewed record that is flagged goes back to draft, and an agent who changes a reviewed record for any other reason sets it back to draft in the same commit, so that it is read again.

## The revision

`record_revision` in `scripts/build.py` is a short hash (eight hexadecimal digits) of the record's JSON without its `review` field, with the keys sorted. Marking a record reviewed does not change it; changing a term, an example, a note or a source does. The builder puts it on the entry's page (`data-rev` on the article, with `data-status`) and in the practice cards (`h`; `d` is 1 for a reviewed record), and `apply_review.py` computes it from the record's file. A verdict carries the revision it was given on.

## The editor's page

Written by the coordinating session.

## On the site: the flag

The site offers a reader the flag and nothing else of the review. Everything is in `src/review.js` (built to `assets/review.js`), which runs on every entry's page, on `practice.html` and on `review.html`.

- **An entry's page** ends with *Notā* (Flag): one tap opens a small box with six reasons to tap (wrong word, vowel length, meaning, example, source, other) and a line to write, both optional; Save. A flag can be changed or withdrawn (tap the flag again). The entry says what was flagged and when, or, if its text has changed since, that it has changed since it was flagged. Without scripts the old link "Suggest a correction or a better word" stands there instead; with them it is inside the flag's box, filled in, for a reader who would rather open a GitHub issue.
- **The back of a practice card** has the flag as a small button beside the link to the entry. Its box comes up over the round as a sheet; the round and its step back are untouched.
- **The flags** are kept in `localStorage` under `lexicon-review`: `{"verdicts": {"<id>": {"v": "flag", "r": [reasons], "n": "note", "t": time, "rev": "revision", "sent": time}}}`. One per record, the latest. Do not rename the key.
- **The review page** (`review.html`, linked from every footer beside Practice) says how things stand (reviewed by the editor, drafts not yet reviewed, the reader's flags not yet sent, and those sent that the site does not show yet) and has the report. Without scripts it gives the two totals in a line.
- **The interface** follows the practice page's language (`lexicon-practice-lang`): Latin by default, English on request. The Latin is Claude's wording, awaiting the editor's review.
- **What is not there**: no "looks right" control, no reviewer's switch, no queue of drafts, no reviewer's name. The browser tests and the builder's tests check each.
- **Verdicts from the first version.** A device that used the site on the morning of 15 November 2026 may hold verdicts with `"v": "ok"` under the same key, and an `"editor"` field. The site still reads them: the review page counts them among what waits to be sent ("Marked right: 2") and puts them into the report, so that nothing given that morning is lost. No page shows them otherwise or makes a new one, and the `"editor"` field is dropped the next time the key is written.

## The report

*Mitte* (Send) on the review page gathers every flag not yet sent into one text: a few lines to read, then the verdicts as JSON in a fenced block. It is written in English whatever the page's language. The editor's page writes its report in the same format, with `"verdict":"ok"` for an entry marked right; the example below has both kinds. A verdict marked right on a text that has since changed is left out by the site (it would be refused).

````
Lexicon review report, 15 November 2026: 2 marked right, 1 flagged.
To apply it: python3 scripts/apply_review.py (see docs/review.md).

Flagged:
- soap (c/soap.html): vowel length. “sāpō an sapō?”

Marked right: bone, train

```json
{"lexicon-review":1,"verdicts":[
{"id":"soap","rev":"b5539a9e","verdict":"flag","reasons":["quantity"],"note":"sāpō an sapō?","t":1794758400000,"date":"2026-11-15"},
{"id":"bone","rev":"0c1d2e3f","verdict":"ok","reasons":[],"note":"","t":1794758460000,"date":"2026-11-15"},
{"id":"train","rev":"4a5b6c7d","verdict":"ok","reasons":[],"note":"","t":1794758520000,"date":"2026-11-15"}
]}
```
````

`reasons` are `word`, `quantity`, `meaning`, `example`, `source`, `other`; `t` is the time of the verdict in milliseconds; `date` is that day on the reader's device. From the site the report goes out by Share (where the device has it), Copy, or a GitHub issue filled in from a link (a long report does not fit in a link and is copied instead). The reader then taps *Missa* (Sent): the flags are kept as sent, no longer counted as waiting to go. "Sent, not yet on the site" counts those the site does not show yet, and *Iterum mitte* (Send again) puts them back among the unsent if a report was lost.

## Applying a report

```sh
python3 scripts/apply_review.py report.txt     # or: python3 scripts/apply_review.py - < pasted text
python3 scripts/build.py
```

The script finds the JSON in whatever text surrounds it and for each verdict:

- **`ok`**, the record's revision being the verdict's: `review` becomes `{"status": "reviewed", "date": <the verdict's date>, "by": "Jack"}` (`--by` names another reviewer).
- **`ok`**, the record having changed since: not applied, and listed as changed since it was read.
- **`flag`**: a line is added to `notes/review-flags.md`, newest first, with the record, its link, the revision, the reasons and the note. A reviewed record that is flagged becomes a draft again. A flag already written (the same record and time) is not written twice.
- A record the lexicon does not have is listed.

It prints a summary and exits non-zero on a malformed report, having changed nothing. Commit the changed records, `notes/review-flags.md` and the rebuilt site together.

## On the site

The foot of an entry says "Reviewed 15 November 2026." or "Draft of …, not yet reviewed."; the reviewer's name is not printed there or anywhere else on the site. The front page's line of totals gives the number reviewed, and so does `review.html`. In the category lists and the English A–Z a reviewed entry carries a small tick after its headword (a class on its `li`, drawn by the stylesheet).
