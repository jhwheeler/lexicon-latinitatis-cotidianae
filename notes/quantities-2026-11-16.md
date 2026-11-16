# Jack’s rulings on vowel lengths, applied (16 November 2026)

> **promptus: held back at the merge (16 November 2026, the coordinating session).** The ruling was applied on the branch as described below, in 26 places of 15 records, with the supine and participle of *prōmō* and its compounds written short to match. It was not merged. The question put to Jack marked *promptus* as recommended and did not say that the readers write *prōmpt-* ten times, that the lexicon writes the sister words *sūmptus, ēmptor, cōmptus, redēmptor* long (about 120 words), or that the house takes hidden quantities from Bennett. He is being asked again with those facts. Until he answers, the records stand as they were before: *promptus* in `ready`, *prōmpt-* elsewhere.
>
> **Settled the same evening.** Asked again with those facts, Jack answered “i am not opinionated on promptus”, and the coordinating session kept the long spelling: *prōmptus, in prōmptū, prōmptuārium*, with the two places that still had it short (`ready`, `porter`) written long and noted against Traupman. The reasons are in the ruling `promptus` (*prōmō* is *prō* + *emō* contracted; Bennett § 52 prints *prōmptus*). What follows below about a short *promptus* describes the branch that was not merged.

On 15 November the macron pass left thirteen rows “for the editor” (`notes/macrons-2026-11-15.md`), with *pējerō* seen on the way, and the third frequency batch left *līctor* and *mūcrō* (`notes/coverage/frequency-batches.md`). Jack answered each on 16 November 2026. This file says what he chose, what was written, and on what each form rests. Everything cited here was read that day: Lewis & Short and de Vaan through `scripts/lookup.py`, de Vaan’s pages as images of the PDF (its text file has lost the macrons), Traupman’s PDF for the page numbers, Juvenal in the LASLA corpus, Gellius in Rolfe’s text.

| | Before | After |
| --- | --- | --- |
| “Found only when the macrons are ignored” (`scripts/latin_unlinked.py`) | 298 words | 273 words |
| The builder’s totals | linked 105,003 (84.9%), ambiguous 11,113, without an entry 6,137 | linked 105,049 (84.9%), ambiguous 11,127, without an entry 6,111 |
| `scripts/check_quantities.py` | 117 disagreements, 0 unexplained | 118 disagreements, 0 unexplained |

The committed copy of `notes/coverage/unlinked.md` said 300 before; it was two words behind the records it was merged with, and a fresh run on the untouched branch gave 298.

54 records were changed and one was added. Ten rulings were added to `data/rulings.json` (`caffea`, `par`, `prendo`, `promptus`, `viscus`, `compesco`, `abdomen`, `aer`, `lictor`, `mucro`), all dated 2026-11-16 and by Jack, and two older ones were extended with a line of history (`common-vowels`, `consonantal-j`). No entry in `data/quantity-exceptions.json` was needed: the one new disagreement with Lewis & Short, *abdōmen*, is explained by its note and its ruling.

## How the rulings are recorded

The records never print the editor’s name, and no note in them had one. So each ruling is an entry in `data/rulings.json` with `by: Jack` and the date, and the note on the record names the ruling, as the rulings of 12 November were recorded (*octō*, *lepōs*, *rixa*). That holds for the single words too (*abdōmen*, *prendō*, *līctor*, *mūcrō*): this is my choice, made so that the attribution is in the data and not only here. The reasons given in each ruling’s `html` are the evidence I read; the decisions are Jack’s.

## The sixteen cases

| # | Jack’s answer | What was written | Places |
| --- | --- | --- | --- |
| 1 | “caffea, as Traupman; note caffēa as Morgan–Owens’s form” | *caffea, caffeae f.* in coffee, with a note on the term that gives Morgan–Owens’s *caffêa* (= *caffēa*) as the form departed from; *caffea spūmōsa* (cappuccino), *caffea expressa* (espresso), and the comment in coffee-maker. Traupman 70 and 293 prints *caffea -ae*, with no long vowel. | 6 places, 4 records |
| 2 | “terebra alone” | Head *terebra, terebrae f.* in drill; example *Terebram affer*; the two sentences of the comment that explained the double head are gone, and a note says what Lewis & Short prints (*tĕrē̆bra*). | 3 places, 1 record |
| 3 | “cochlea alone” | Head *cochlea, cochleae f.* in screw; the sentence of the comment about the two forms is gone, and a note replaces it. The note in snail now names the ruling. | 2 places, 1 record |
| 4 | “icō, icere, īcī, ictum (the common-vowels ruling)” | The entries in strike and sting, each with a note. Present forms in the texts: *icere* in golf, kick (2), league (2), shot-goal, treaty (2); *icunt* in scorpion and snake; *icī*, the passive infinitive, in thunderbolt (lightning already had it); the label *iciō* for Lewis & Short’s headword in treaty (2) and lightning. | 16 places, 11 records |
| 5 | “impār everywhere” | *impār, imparis* in odd-number, and *impār* in its evidence, comment (twice) and two examples. *dispār* (different) and *compār* (compare) were already written so, and no unmarked nominative of either was found. | 6 places, 1 record |
| 6 | “prendō, prendere, prendī, prēnsum” | The entry in capture-catch, with a note. The texts (*prendam*, *prendet*) and *prehendō (prendō)* in arrest were already short; *prēnsō*, *prēnsiō*, *dēprēnsus* keep the long vowel before *ns*. | 1 place (3 words) |
| 7 | “promptus, in promptū, promptuārium” | See “The family of *prōmō*” below. | 26 places, 15 records |
| 8 | “vīscus, vīscera” | *vīscus, vīsceris n.* in organ-body, with *vīscera* in its gloss and comment; *vīscera, vīscerum n. pl.* in guts-intestines; a note on each. The one text (Verg. A. 6.253) already had *vīscera*. | 4 places, 2 records |
| 9 | “compescō” | *compescō, compescere, compescuī* in control-restrain; *Compesce mentem!* in calm-down. Both had followed Traupman, who prints *compēscō* (291) and *compēsce mentem* (101, 336); each has a note against him. | 2 places, 2 records |
| 10 | “abdōmen, with a note against Lewis & Short, once the verse is checked” | The verse confirms it (below). *abdōmen, abdōminis n.* in belly, *abdōmen* in its quotation of Plautus, *Abdōminī* in its example; note on the term. glutton already had *abdōminī*. | 3 places, 1 record |
| 11 | “dētergē, with the entry” | *Dētergē faciem sūdāriolō* (Cordier, Coll. 2.69) in handkerchief. | 1 place |
| 12 | “āëra, āëria everywhere” | *āëra* in cause, encourage, nature-world; *āëria* in hijack and pressure-physical; *āëriā* in turtle-dove; *āëris* in pressure-physical and sultry; *Āëris* in buenos-aires; *āëroplanīga, āëroplanīgae* in pilot. | 11 forms, 9 records |
| 13 | “pejerō, by the rule” | *pejerō, pejerāre, pejerāvī, pejerātum* and the label in perjury, with a note; *pejeret* in talk-round. A line of history in the ruling `consonantal-j`. | 3 places, 2 records |
| 14 | No choice; he asked what *Eho istic!* probably means | Nothing. | 0 |
| 15 | “keep līctor; read Gellius to confirm” | Gellius was read and confirms it (below). The note in lictor now quotes him. | 1 note |
| 16 | “enter it as mūcrō” | New record `point-of-a-sword` (below). | 1 record |

Homographs were looked at one by one. *viscum, viscī*, mistletoe and birdlime (mistletoe, snare), is another word and keeps its short i: Lewis & Short has it as a separate article and de Vaan heads it *viscum* on the page where he heads *vīscus*. *īcit* in punch-blow (Plaut. Pers. 846b, *colaphō mē īcit*, translated “he’s punched me”) is the perfect and stays long. *impare* (Verg. E. 8.75) and the other oblique cases are short. *cafēum* (cafe) is another word. Link targets and the `sources` lines were not touched: they belong to another part of tonight’s work, and they give the dictionary’s own headword.

## The family of *prōmō*

De Vaan, p. 188, s.v. *emō*, read from the page image: “*prōmere*, pf. *prōmpsī* ‘to bring out, forward’ (Pl.+), *promptus, -ūs* ‘the action of making available’ (Lucr.+), *prōmus* ‘steward’ (Pl.+), … *promptāre* ‘to be in charge, be steward’ (Pl.), *promptārius* ‘that serves for storing’ (Pl.+), *exprōmere*”. Lewis & Short marks only the present (*prōmo, mpsi, mptum*) and says of *promptus, a, um*: “Part. and P. a., from promo”. Traupman prints *promptus* (366, 369) and *in promptū* (68, 84, 211), but *prōmptā (prōmptāte) chartās* (33).

What was written, and on what authority:

| Form | Where | Authority |
| --- | --- | --- |
| *promptus, prompta, promptum*; *promptōs*, *promptī*, *promptum animum*, *promptius* | ready (already so), aggressive, ahead-in-time, example, visible, wonderful, incentive | Jack’s ruling; de Vaan’s *promptus* |
| *in promptū* | available (5), yourself; porter already so | Jack’s ruling; Traupman |
| *promptuārium, promptuāriī*; *cella promptuāria*, *promptuāriā*; *armārium promptuārium* | storeroom (5) | Jack’s ruling; de Vaan’s *promptārius* |
| *promptō, promptāre*; *promptā (promptāte) chartās* | hand-out (4), with a note against Traupman 33 | de Vaan’s *promptāre*. My extension of the ruling. |
| *prōmō, prōmere, prōmpsī, promptum* | produce-bring-out, with a note | present and perfect: de Vaan, as the task said. Supine: my extension of the ruling, because the adjective Jack ruled on is this participle (Lewis & Short). |
| *exprōmō, exprōmere, exprōmpsī, expromptum* | download | the same |
| the participles *promptum*, *promptīs*, *dēprompta* | freezer, set-the-table, wardrobe | the same |
| *prōmpsit*, *prōmpsistī*, *prōme*, *prōmere*, *prōmunt* | unchanged | de Vaan’s *prōmere, prōmpsī* |

The ruling `promptus` says which of these Jack named and which were written to match.

Two things follow from this, for the editor:

- The participles in freezer, set-the-table and wardrobe are quotations from the readers, which still have *prōmpt-* (list below). Until the readers are corrected, `scripts/check_libelli.py` reports those three examples as not found.
- The forms *promptus, promptī, promptōs, promptum, prompta, promptīs, promptā* now belong both to the adjective and to the verb, so the linker leaves them unlinked as ambiguous (11 words). Before, the long spelling linked most of them to the verb. This is the linker being careful, not a slip.

## The verse for *abdōmen*

Juv. 4.107, in the LASLA corpus (`Juvenalis_JuvSaturae_JuvSatur.conllup`, Satura 4, Versus 107): *Montani quoque venter adest abdomine tardus*. Scanned: *Mōntā* | *nī quoque* | *venter a* | *dest ab* | *dōmine* | *tardus*, that is spondee, dactyl, dactyl, spondee, dactyl, spondee. The fifth foot is *-dōmine*. Its first syllable is open (*ab-dō-mi-ne*), so its weight is the vowel’s own: the ō is long. With a short o the line would have three light syllables together, which a hexameter cannot hold. Juv. 2.86, *atque bonam tenerae placant abdomine porcae*, has the word in the same place. De Vaan, p. 20, heads the entry *abdōmen, -inis*. The ruling was applied; the note in belly and the ruling `abdomen` give the scansion.

## Gellius on *līctor*

Gellius 12.3 was read in J. C. Rolfe’s text (Loeb, 1927) as the Perseus Digital Library gives it (`canonical-latinLit`, phi1254.phi001.perseus-lat2); the loci collection has only extracts and the corpora on this machine do not have him. The chapter gives two derivations: Valgius Rufus’s from *ligāre* (the lictor bound the hands and legs of a man to be beaten), which Gellius accepts, and Tiro’s from *līmus* or *līcium*, the girdle the attendants wore. Section 4:

> Si quis autem est qui propterea putat probabilius esse quod Tiro dixit, quoniam prima syllaba in “lictore”, sicuti in “licio”, producta est et in eo verbo quod est “ligo” correpta est, nihil ad rem istud pertinet. Nam sicut a “ligando” “lictor” et a “legendo” “lector” et a “viendo” “vitor” et “tuendo” “tutor” et “struendo” “structor” productis quae corripiebantur vocalibus dicta sunt.

So Gellius says outright that the first syllable of *līctor* is long while that of *ligō* is short, and that the word was made, like *lēctor*, *vītor*, *tūtor* and *strūctor*, “with vowels lengthened that were short”. He names the vowel, so this is evidence for the vowel’s length and not only for a heavy syllable. (*vītor* is Lachmann’s correction of the manuscripts’ *vivendo victor*, as Rolfe’s note says.) De Vaan prints *līctor* too, under *ligō* (p. 341); batch 3’s note that he has no article was a slip, since the word is in his index. The note in lictor and the ruling `lictor` quote the passage. The passage is also ancient testimony for *lēctor* and *strūctor*, which the ruling `lachmann` could cite beside Gell. 9.6.3; I did not add it there.

## The record for *mūcrō*

New record `point-of-a-sword`: “point”, sense “the sharp end of a sword or blade”, a noun, in the category of the weapons (`res-publica`, where sword, dagger and spear are). It is a record of its own and not a term in `tip-end`, whose words (*apex*, *cacūmen*) are tops.

- Term: *mūcrō, mūcrōnis m.*, classical; the gloss is Lewis & Short’s (“a sharp point or edge; esp., the point of a sword”; by transfer, a sword).
- Evidence, from Lewis & Short’s article: Cic. Phil. 14.6, Verg. A. 2.333, and its *mucro falcis* (Col. 4.25.1). The first two are bare references because the dictionary adapts the words.
- Examples, each containing a form of the word: Verg. A. 2.333–334 and Cic. Phil. 14.6, both in the words of the LASLA text (the method of batch 3); and Ambrose’s *Aeterne rērum* 21–24 from the loci collection (`loci-augustinus.md`), cited as the other examples from his hymns are.
- Note and ruling: Lewis & Short prints no mark; the *u* stands before *cr*, so a heavy syllable in verse does not prove it long; the long ū is Jack’s ruling, following the loci collections. De Vaan heads the entry *mūcrō* (p. 391): batch 3’s note that he has no article was a slip here too.

`scripts/answer_kinds.py` does not list the record. No new family was made by it.

## Families

Listed before and after with `scripts/family_sample.py --list`. Five families changed or are new, and each was checked in Lewis & Short:

- *dispār, impār, pār, pariter*: the same family, with the new spelling.
- *exprōmō, prōmō, promptō, promptus*: *promptus* has joined. Right: Lewis & Short, “promptus, a, um, Part. and P. a., from promo”; “prompto, āre, v. freq. a. [promo]”.
- *icō, ictus* and *prendō, prēnsō*: the same families under the new spellings (Lewis & Short: *ictus, ūs* [ico]; *prenso*, see *prehenso*, frequentative of *prehendo*).
- *terebra, terebrō*: new, because the noun now has a dictionary form. Right: Lewis & Short, *terebro* [terebra].
- *vīscera, vīscus*: the same family, with the new spelling. *viscum* is not in it.

Nothing was added to `data/families.json`, and it named none of the changed words.

## Reader texts that now disagree

Searched: `src/fabula-*.txt` and `src/coquina-theodori.txt` in the Latinitas checkout, for every old spelling. No *caffēa*, *in prōmptū*, *terēbra*, *cōchlea*, *impar*, *prēndō*, *compēscō*, *abdomen*, *pējerō*, *āera*, unmarked *lictor* or *mucrō*, and no present form of *īcō*, was found. What was found:

| File | Line | Has | By the rulings |
| --- | ---: | --- | --- |
| `fabula-01-iter.txt` | 34 | prōmptā | promptā |
| `fabula-01-iter.txt` | 96 | dēprōmpta | dēprompta |
| `fabula-03-apud-papam.txt` | 26 | prōmptum | promptum |
| `fabula-03-apud-papam.txt` | 294 | prōmptam | promptam |
| `fabula-04-dies-gratulationis.txt` | 67 | prōmptam | promptam |
| `fabula-04-dies-gratulationis.txt` | 176 | prōmptum | promptum |
| `fabula-04-dies-gratulationis.txt` | 242 | prōmptīs | promptīs |
| `fabula-06-reditus.txt` | 69 | prōmptum | promptum |
| `fabula-06-reditus.txt` | 120 | prōmptōs | promptōs |
| `fabula-07-osoitsa.txt` | 20 | prōmptōs | promptōs |
| `coquina-theodori.txt` | 407 | viscera | vīscera |

All ten *prōmpt-* are participles of *prōmō*, so they depend on the extension of the ruling to the participle. Lines 96, 176 and 242 are the three quoted in the lexicon (wardrobe, freezer, set-the-table). Outside the readers, the loci collection still has *Dēterge faciem sūdāriolō* (`loci-corderius.md`, line 278).

## For the editor

- **The participle of *prōmō*.** Written *promptum, expromptum, dēprompta* to match the ruling. De Vaan’s page is not uniform on participles in *-mpt-*: he prints *promptus, -ūs*, *sumptus, -ūs*, *sumptiō*, *sumptuōsus*, *emptor*, *emptus, -ūs*, *comptus, -ūs*, *redemptor* without a macron, but *ēmptum* as the participle of *emō* and *dēmptiō*. Recommendation: confirm *promptum*; if it is refused, eight places go back (the two supines, the three participles, and the readers stay as they are).
- **The sister words.** The lexicon writes *sūmptus*, *sūmptiō*, *sūmptuōsus*, *ēmptor*, *ēmptiō*, *cōmptus*, *redēmptor* long throughout (about 120 words), where de Vaan prints most of them short. With *promptus* now short the family of *emō* is written two ways. Nothing was changed. Recommendation: one question to Jack for the class, since Bennett, who is the house authority for hidden quantities, is not among the reference files.
- ***īcit* in punch-blow** was kept as a perfect, as its translation has it. If it is read as a present it would be *icit*.
- ***Dētergē* in Cordier.** Applied as ruled. Lewis & Short also knows a later *dētergō, -ere*, whose imperative is *dēterge*, and Cordier may have written that; the loci row still has *Dēterge*.
- **Morgan–Owens’s spellings quoted in comments** (*aëroplanum* in pilot, *aëronauticus* in steward, *cafēa*, and “like *caffēa*” in the second term of coffee) were left as quotations of his forms.
- ***āëroplanīga*** and ***Āëris*** were given the diaeresis as part of “everywhere”; Jack named only *āëra* and *āëria*.
- ***Eho istic!*** is open (case 14).
