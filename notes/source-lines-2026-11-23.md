# Source lines: Traupman's pages made whole (23 November 2026)

Jack, 23 November 2026: "Let's do a cleanup pass, probably haiku can handle it?" The pass was offered after the researchers of the day's sweeps said that many older records "still cite the readers". That was wrong, and so was Claude's passing it on: by the ruling of 13 November (AGENTS.md, "Examples from the *Theodōrus et pater* readers") a source line that names the readers stays in the data and the site does not show it. Nothing was changed there. 533 records carry such a line.

What a survey of every record did find was that the rule "a work is cited once in a record, with all its pages together" (docs/records.md, "Sources are citations") was not kept for Traupman. The fixes were made by a script, since each can be read off the record itself; Haiku looked up the pages that could not. Only `sources` changed, in 2,159 records, apart from the ten fields named below. `review` was not touched: a completed citation gives a reader nothing new to judge.

## By script

- 456 records had the bare line "John C. Traupman, *Conversational Latin for Oral Proficiency*." with no page. Each now has the pages its own evidence and examples cite.
- 1,341 records had a Traupman line that lacked pages their evidence or examples cite ("Traupman 406" under a term, `pp. 87, 89, 337` under Sources). The pages are added, in order; a page inside a range is not repeated.
- 170 records cited Traupman pages in evidence or examples and had no Traupman line. One is added.
- 175 lines held two works ("Morgan–Owens, *Adumbratio*: s.v. apron. John C. Traupman, …, p. 116."). Each work now has its own line. A sentence that is true of the one record ("Traupman and Levi–Bini have no word") was left where it stood.

Every record was first read and written back in the repository's format and came back byte for byte. Of the changed lines, all but trailing commas are citations of Traupman, Morgan–Owens, de Vaan, Levi–Bini, or Lewis & Short. The 12,000 page references read from evidence were checked for what follows the number, so that nothing but a page was taken for one.

## Looked up (Haiku), each line checked against the text by script

- swing: Traupman pp. 53, 389 (*oscillum*); the record had a link to a PDF and no page.
- square (the tool): *norma* is on pp. 168 and 384, not 165 as the record said.
- Pages added where Traupman gives the word again: bucket (37, 284), cap (114), pipe (360), plane (360, 361), plumb bob (361).
- criticism, Mississippi, York: Traupman has none of the record's words (he has *reprehendere* for criticize, the state of Mississippi, and New York). The bare Traupman line is removed.
- Nine records with a link "Traupman: Conversational Latin" or "Traupman (fourth edition)" in a chain of links now have the citation in the house form, with their pages.

## Single slips

- write: filed under the body; now under school.
- too-big: "Horace (Ep. 1.10)." is now "Horace, *Epistles* 1.10.42–43."
- animal, cabbage: a note on how the texts were checked removed from Sources.
- blouse, toilet-paper: Morgan–Owens is cited in evidence; the source line is added.
- cabbage, potato: a usage mark copied from the loci tables ("ūsus: Culīna") taken out of an evidence line and a comment.

## Left as they are

- Lines in the older chain form ("Morgan–Owens: blanket · Vicipaedia: Lodix · …") other than their Traupman link, and Morgan–Owens lines that name a section and no headword ("numbered food and kitchen sections", in 29 records; "geographical section" is the ruled form).
- Sentences true of one record ("No source has a word for airplane mode"), which the rule allows.
- 19 lines that give several authors in brackets ("Cicero (Rep. 1.49, Or. 188), Caesar (B.G. 1.43.1)"), kept by the ruling of 16 November for lines that name a place.
