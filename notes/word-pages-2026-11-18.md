# Word pages: the sweep of 18 November 2026

Jack, on the page for *plūs*: "This entry is all sorts of confusion", and then: "let's go through the lexicon and find other places where there's weirdnesses like this." What was wrong with that page, what the same faults looked like elsewhere, and what was left for him.

## What was wrong with *plūs*

1. The adverb's gloss ("love more") stood under the noun's grammar ("used in the nominative and accusative").
2. Two entries called "more" were listed with nothing to tell them apart.
3. *plūs minus* was given as "less": it was filed as an alternative under **less**.
4. The family line named only *plūrālis*.
5. Nothing said that the genitive *plūris* is the genitive of value.

## The same faults elsewhere

| Fault | How it was looked for | Found | Done |
|---|---|---|---|
| A use with a grammar of its own run into another's line | every word page, before and after | 35 pages (*praestō, cōnsultō, eō, multō, vērum* …) | builder: such a use is set out under its own grammar |
| Entries of the same name not told apart | every word page | wherever a record has a `sense` | builder: the sense follows the entry's name |
| A phrase's first word made a headword (*plūris (minōris) cōnstāre* as the word *plūris*) | every term with a bracket after its first word | 37 phrases, 24 pages | builder: `TERM_HEAD` cuts at a bracket only where it gives a variant of the word |
| The same gloss twice on a word's page ("depressed, downcast; downcast, depressed") | every word page | 86 pages | builder: `distinct_glosses` |
| A gloss that is a remark, not a meaning ("the same word, another spelling", "to one", "fem. dermatologa"), which a word's page prints as its definition | glosses read by pattern, then the 729 glosses that share no word with their entry's English, one by one | 22 | rewritten to stand alone; *Mōns Lūnae* under Sintra is a reviewed record and was left |
| A term filed under an English it does not mean | the same 729 | *plūs minus* and *magis minusve* under less; *dissentiō* under agree | moved to **about (roughly)**; taken out of agree (it is under disagree) |

## For Jack

- *inedia* stood under **appetite** and *repulsa* under **apply** as "also used", each for an English it does not mean. Jack, 19 November 2026: "Moved to their true sense". *inedia* is now the answer of a new entry, **fasting** (going without food), with *jējūnium*; *repulsa* is under **defeat**, where it already stood, and "defeat at the polls" and "lose an election" went with it.
- *Mihi male est.* stood under **I’m having a lovely time** in the same way (seen on the new page for *male*); it is now the answer of **I’m having a bad time**. So did *malā fidē* under **honestly**: now **in bad faith**.
- *plūrēs* and *complūrēs* cannot be named in `data/families.json`: a plural adjective of two forms (*plūrēs, plūra*) is not a word the family method knows, so the family of *plūs* shows *plūrimī, plūrimum, plūrālis* and not those two.
- Morgan–Owens cites Mart. 9.100 for *plūs minus*; that was not checked. Lewis & Short has Hirt. B.G. 8.20.1, which is now the evidence, and gives Mart. 8.71.4 for *plūsve minusve*.
- *male* had no entry of its own: its page was the phrase *male (mehercule) dē* ("too bad about"). Jack, 19 November 2026: "make the male page". It is now the answer of a new entry, **badly**.

## What this did not do

The 729 glosses were chosen by a rough test (no word in common with the entry's English, its sense, or its other names). A term misfiled under an English that its gloss happens to share a word with, as *plūs minus* did with "less", is not found that way: *plūs minus* was found by Jack. Reading every record is the review's work.
