# Concept records, notes and rulings

The lexicon has **one record per concept**: one sense of an English word, with every Latin form for it. The first 23 records (8 November 2026) were a pilot converted from four grouped entries; by 9 November every grouped topic card (`data/entries/`, see `data-format.md`) had been converted, batch by batch, into records that stay drafts until a person has read them. New words go in as records.

The builder renders each record as a page of its own at `c/<id>.html`; lists it, with its leading Latin, on its category's page (`k/<domain>.html`, and on the pages of any categories in `also_under`) and in `words.html`; indexes it for the search (`assets/search-data.js`); shows it on `rulings.html` under each ruling its notes cite; and lists it on the page of each Latin word it uses (`l/<word>.html`, below), which `latin.html` lists in turn. `how-we-decide.html` states the general rules and links to the rulings page, and back. `sitemap.xml` lists every page.

## A record: `data/concepts/<id>.json`

```json
{
  "id": "perhaps",
  "english": "perhaps",
  "pos": "adverb",
  "also": ["maybe", "perchance"],
  "domain": "sermo",
  "terms": [
    {"latin": "fortasse", "status": "recommended", "period": "classical", "gloss": "maybe, perhaps",
     "evidence": ["Cic. Div. Caec. 40: <span lang=\"la\">fortasse dīcēs</span>"],
     "comment": "The everyday word of Cicero’s prose, with the indicative.", "notes": ["short-e"]},
    {"latin": "forsan", "status": "alternative", "period": "classical", "register": "vōx plērumque poētica: Verg., Hor."}
  ],
  "phrases": [{"latin": "Fortasse pluet; paenulam indue.", "english": "Maybe it’ll rain; put your coat on.", "source": "composed"}],
  "notes": {"short-e": {"form": "fortasse", "claim": "short final e",
                         "against": "Lewis &amp; Short <span lang=\"la\">fortassē</span>, without evidence",
                         "html": "Catull. 85.1, … the fifth foot, <span lang=\"la\">-tasse re-</span>, is a dactyl. …",
                         "ruling": "fortasse"}},
  "related": ["entry-300"],
  "sources": ["<a href=\"https://logeion.org/fortasse\" rel=\"noopener noreferrer\" target=\"_blank\">Lewis &amp; Short: fortasse</a>"],
  "review": {"status": "draft", "date": "2026-11-08", "by": "Claude"},
  "replaces": ["entry-550"]
}
```

| Field | Required | Holds |
| --- | --- | --- |
| `id` | yes | a slug (`a-z`, digits, hyphens), the same as the file name; the page is `c/<id>.html` (old links to `index.html#c-<id>` lead there) |
| `english` | yes | the English headword, one sense |
| `sense` | no | a short disambiguation, shown after the headword (“the activity”) |
| `pos` | no | the headword’s part of speech, shown after it: `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `interjection`, `numeral`, `phrase`, or a list of them (`["verb", "noun"]`) |
| `also` | no | other English words that should find this concept in search |
| `domain` | yes | a category ID from `data/catalog.json`: the record's own category |
| `also_under` | no | other categories whose pages list the record too (soap is a kitchen record listed under the household); the search counts it in each |
| `wikidata` | no | the Wikidata item (`Q…`) for the sense |
| `audience` | no | `child` (default) or `adult` |
| `terms` | yes | the Latin forms; at least one `recommended` |
| `phrases` | no | examples: `latin`, `english`, and `source` (`composed`, or a citation in rich text) |
| `notes` | no | footnotes, by key: `html` (rich text); for a note on a form, `form`, `claim` and optionally `against` (below); optionally `ruling` (an ID in `data/rulings.json`) |
| `related` | no | other concept IDs (or the ID of a grouped card, should one remain) |
| `sources` | yes | the lines of “Sources”, in rich text: citations only, each work once, no standing notes (see below); an empty list where there is nothing to cite |
| `review` | yes | `status` (`draft` or `reviewed`), `date` (YYYY-MM-DD), `by` |
| `replaces` | no | IDs and anchors of grouped entries this record absorbs; they stay valid links |

A **term** has `latin` (lemma with genitive and gender, or principal parts), `status` (`recommended`, `alternative`, `avoid`), `period` (`classical`, `post-classical`, `late`, `medieval`, `renaissance`, `modern`, `ours`), and optionally `gloss` (English, if narrower than the headword), `grammar` (see below), `register` (rich text, in the house’s Latin labels), `evidence` (a list of citations in rich text: “Traupman 50”, “M-O s.v. swimming”, “Plin. NH 7.78”, with a quotation where it helps), `comment` (rich text) and `notes` (footnote keys).

`gloss`, `grammar` and an example's `latin` and `english` are plain text: no tags and no entities (the builder refuses them, since they would be printed as written). Rich text follows the rules of `data-format.md`: `<strong lang="la">`, `<span lang="la">`, `<em>`, external `<a>` links; macrons and j as everywhere else.

### Coinages only where needed

A word or phrase we made ourselves (a term whose `period` is `ours`) belongs in the lexicon only when it is needed: when no author of any period has a word for the concept, or when a circumlocution has a really good reason (Jack, 13 November 2026). Otherwise the word is taken from earlier authors. They need not be classical, though the closer to Cicero the more weight, and the modern reference works count as sources (Traupman's *Conversational Latin*, Morgan–Owens, Levi–Bini, Andresian). In practice:

- **Look before marking a term `ours`.** Search the English in the reference works and the Latin in Lewis & Short (`scripts/lookup.py`). Several terms once marked ours had a source after all: *bēta rubra* is Mattioli's (in Morgan–Owens), *minūtātim concīdere* Apicius's, *lac acidum* Pliny's.
- **A coinage that says what an attested word says is not entered.** Under *shoelace*, our *vincula calceōrum* stood as the recommended term beside Cicero's *corrigia*; it was deleted and *corrigia* recommended.
- **An ordinary combination of attested words is not a coinage, and not a term.** *Crēta colōrāta* (coloured chalk), *pīsa viridia* (green peas), *grūs lūsōria* (a toy crane) go among the record's `phrases`, as examples with the source `composed`.
- **A coinage that is needed says why**, in its `comment`: what was searched and what was found wanting ("No reference work has a word for a phone's notification", "Traupman has only the adjective"). Follow "Saying that something is not attested" in [drafting.md](drafting.md).
- **Household words the editor has ruled on stay** (*vestis nocturna*, *lūsōrium*), marked as what they are.
- **A classical word used of a modern thing keeps its period.** It is labelled `classical`, not `ours`: the gloss gives the classical sense and then the new one (*cubus*: "a cube: a building block"), the evidence is Lewis & Short's citations of the word, and the comment says what the word is classically and that its use here is modern, and ours. The editor ruled so for *mendum* and *ēmendāre* (14 November 2026) and for *aestimātor*, *statiō*, *sellula* and *cubus* (Jack, 16 November 2026); *folliculus*, *alveolus*, *pertica* and *ācroāma* were entered the same way that day. Other classical words stretched further (*ānsa* for a climbing hold, *cōdex* for code) are still marked ours: whether the ruling reaches them has not been asked.

The builder enforces one part of this: a record may not have a `recommended` term of period `ours` when it also has a `recommended` term of another period. It does not yet require a stated reason on every `ours` term. The pass of 13 November 2026 went through the 153 coinages that stood beside an attested term, and the editor ruled on the doubtful ones the next day (`notes/coinages-2026-11-13.md` lists each, with what was done and why); the records with no attested term at all were gone through on 15 November 2026, and the editor ruled on the doubtful ones on 16 November (`notes/coinages-2026-11-15-a.md`, `-b.md`).

### The answer answers the headword

A record's first recommended term is its answer: the page prints it first, and the practice cards ask the English headword and show it. So it must be the kind of word the headword is (Jack, 14 November 2026, after *mountain range*, a noun, was answered only by the verb phrase *perpetuīs jugīs tendere*, "stretch in an unbroken range", and looked broken):

- **A noun headword is answered by a noun, a verb by a verb, an adjective by an adjective**, wherever the sources have one that truly answers it: confirmed in Lewis & Short, or cited from Traupman or Morgan–Owens by page or headword. *Mountain range* is now *montēs perpetuī* (Traupman 205), with *jugum* beside it; the verb phrase, which is Pliny's, is an alternative with its own gloss.
- **Where Latin really says the thing with a verb** (*accountability* is *ratiōnem reddere*), the verb stays, and the record is honest about it: the gloss reads as the verbal phrase ("give an account"), and the comment says that Latin uses a verb here. The same holds for an adverb or a genitive that does an English adjective's work.
- **Where the headword is truthfully two parts of speech** (*balance*, *gallop*), `pos` lists both; put the other English wording in `also`.
- **Never make up a noun to make the card neat.** A word of the right kind that is rare, late or technical may stay below the classical idiom when the comment says why.

`python3 scripts/answer_kinds.py` lists the records whose answer does not look like their headword's kind. It is a list to read, not a check: most of what it still reports are records of the second kind. The pass of 14 November 2026 is written up in `notes/answers-2026-11-14.md`.

### Sources are citations

A line of `sources` is a citation as a book would print it: the author, the work, the place (Jack, 13 November 2026). It does not say how the book was read or checked ("checked against the searchable text", "supplied PDF", "printed page numbers"): that belongs in the commit or the session notes, and the builder rejects it. A work is cited once in a record, with all its pages together and in order: `John C. Traupman, <em>Conversational Latin for Oral Proficiency</em>, pp. 211, 219, 294.` When a later pass adds a page, add it to that line; never add a second line for the same work. The builder rejects a repeated line and a second citation of Traupman.

**The standing notes are said once** (Jack, 15 November 2026: "We can just say it once"). Until then the same sentences stood under Sources in record after record: that quotations marked "Lewis & Short" are given as Lewis & Short cites them, that the example sentences marked "composed" are ours, that the quotations come from the Latinitas loci collections or were checked against the Perseus or Latin Library texts, how Graesse was read. They are notes on how to read the lexicon, not citations. They now stand in one place, the section "How to read the sources" of `src/how-we-decide.html` (`how-we-decide.html#sources`), and the builder draws one link to it under the sources of every entry that has any. So:

- Do not write such a sentence in a record. If a new one is needed (a new mark, a new edition, a new digital text), add it to that section.
- A citation joined to such a note keeps the citation: `Cicero, <em>De officiis</em> 1.124.`, not "Cicero, *De officiis* 1.124, checked against the Perseus Latin texts"; `J. G. Th. Graesse, <em>Orbis Latinus</em>, ed. F. Benedict (1909).`, not "…, read in the digitization at columbia.edu". A link to where a work can be read belongs in the section, not in each record.
- The builder refuses a record that carries one, and its message gives the line as it should stand or says to delete it. The sentences it knows are the patterns `STANDING_NOTES`, `CITED_WITH_A_NOTE` and `READ_IN` beside `SOURCE_METHOD` in `scripts/build.py`; `without_standing_notes()` is the test. The three that stood in the most records (the Lewis & Short mark, "composed", Graesse's "read in the …") are refused in any wording (`STANDING_PHRASE`).
- What is true of one record only is not a standing note and may stand, as a sentence of its own: "Quintilian keeps his edition's spelling *adfectūs*", "Cicero as Lewis & Short quotes him" (where the quotation itself carries no mark), "No source has a word for a podcast". Better still, put it where it belongs: a mark on the example, a comment on the term.
- `sources` may be an empty list. A record whose only line was a standing note has none left (24 on 15 November 2026, most of them descriptions of ours); its page then has no "Sources" and no link. A record with an attested term should not stay so: give it its dictionary line.

`notes/standing-notes-2026-11-15.md` lists each sentence that was taken out, with its count, and what was left in the records on purpose.

### How a page shows a record

- A term whose period is `ours` is printed with an asterisk before it, on the record's page and in the word lists (Jack, 11 November 2026): the linguist's sign for an unattested form, chosen because it needs no colour and no icon to learn.
- The headword line is the English word in bold with its part of speech (`perhaps` *adverb*), then `sense` and `also`.
- The first recommended term is the answer: its headword is bold and links to the word's page, and its grammar line follows. The builder reads the grammar from the dictionary form: `caccabī m.` gives "noun, second declension" and `tītillāre` gives "verb, first conjugation". A term's own `grammar` overrides it, as in "verb, first conjugation, transitive". The term's `gloss` is shown only when it differs from the headword.
- The lexicon prints no declensions or conjugations; it links to them (Jack, 13 November 2026). In the grammar of a one-word term that inflects, the words that name its declension or conjugation ("third declension", "first conjugation") are the link, on the record's page and on the word's; there is no separate "Declension on Wiktionary" label, which stood out too much. Where the grammar names neither ("verb", or no grammar), the bare word "declension" or "conjugation" is added and linked. The link goes to the word's Latin section on English Wiktionary, under the spelling Wiktionary uses: no macrons, and i for consonantal j (*jūs* is at `ius#Latin`). The builder decides from the dictionary form (`caccabī m.`, `bonus, bona, bonum`, `tītillāre`), or from a bare word's own `grammar` when it begins with the kind ("verb, third conjugation"). An adverb, a particle, a saying or a form of another word (*animī*) has no link in its grammar: every word's page links to Wiktionary beside Logeion, under Dictionaries, and to the word's Lewis & Short article on Latinitium where Lewis & Short has the word (by entry number; see `refs/README.md`). The links are made from the spelling and are not checked against Wiktionary, so a coinage it lacks leads to its "no entry" page.
- The period and the evidence of the answer stand in the margin. So do the notes, each beside the line that cites it. On a phone they fold under that line.
- The other terms come next, under "Other words", each with its gloss, grammar, status, period and evidence. They stand before the examples because the examples illustrate every term of the record, not only the first (Jack, 11 November 2026).
- Examples come last, each with its source. When a record has both quotations and composed sentences, a filter offers All, From authors and Composed.
- The sources close the page: the lines of `sources` (without the lines that name the readers), then the review state, then one quiet link, "How to read the sources", to that section of How we decide, drawn only when the entry has sources to show. The practice cards and the search results have no such link.

## Latin word pages: `l/<word>.html`

Every Latin word that heads a one-word term (`caccabus` in `caccabus (cacabus), caccabī m.`) gets a page. It lists every record that uses the word, and the longer terms it appears in (`ōlla` in `ōlla ānsāta`, once `ōlla` has a term of its own). It also gives the words of its family (below, "Word families"), the notes on the word, the rulings whose `forms` include it, and the examples from the entries where it is the recommended word or that contain it. The page name drops macrons (`l/tyrocnestis.html`). Two words that differ only in macrons get `-2` and so on, in sorted order.

### Every Latin word linked

Jack's request (13 November 2026): every word of the lexicon's Latin should lead to its entry. Wherever a term is shown, and in every example sentence on an entry's page and on a word's page, each word is a link to the page of the word it is a form of: *potest* to *possum*, *exīre* to *exeō*, *casā* to *casa*. A head of one word leads to its own page, as before. In a term the links are underlined in red like any link; in an example they are quiet (the class `tap` on the sentence: the same ink, underlined only under the pointer or the keyboard's focus), so that a page of examples is not a web of red lines. A word is never linked to the page it stands on. Latin quoted inside comments and notes is not linked, nor anything in the search results, the practice game or the indexes.

How a word is found (`FormIndex` in `scripts/build.py`):

- **The forms.** The stems the search computes for each term (`search_stems`) with the endings of their class, a table of the commonest irregular forms (`IRREGULAR_FORMS`: the pronouns' cases, *domī*, *vim*, *dīc*) and of stems the dictionary form does not show (`IRREGULAR_STEMS`: *melior*, *optimus*, *stetī*), the other words a term gives (*ac* in `atque (ac)`), and three things tried when a word is not found as written: a question clipped of its *-ne* (*satin’*), an enclitic *-que*, *-ne* or *-ve*, and the spellings of early Latin (*servos*, *vortit*, *optumus*).
- **Macrons decide.** Each stem keeps the marked spelling of the dictionary form it was cut from, and the endings are compared with their quantities: *mālus* is not *malus*, *ēst* is *edō* and *est* is *sum*, *cūra* is the noun and not the imperative *cūrā*. So a term's dictionary form must be complete and correctly marked for its forms to be found: a verb given without its perfect is not found in the perfect. A word that would be found only without its macrons is not linked; the report lists it, since a macron is then probably missing or wrong.
- **One word or none.** A form that could belong to several words is linked only when the choice is safe. Entries that are the same word are no ambiguity: a one-word saying yields to the word it is made of (*tacē* is *taceō*), an entry made of a form to the word that has the form (*est*, *illa*, *omnia*), an entry for a plural to its singular (*litterae*, *mōrēs*), an adjective to the adverb made from it when the adverb has an entry (*certē*, *minus*). Of words that really differ, the commonest is taken only if it is twenty times as frequent in `refs/latin-frequency.tsv` as each of the others (`LINK_RATIO`), never in place of a word that stands in the text in its own dictionary form (*eō* the verb, *vīs*, *amor*), and never a verb for its participle against a noun or adjective of the same form (*lāta*). Everything else is left unlinked: *canis*, *quod*, *quam*, *prīmum*. A wrong link is worse than none.

The builder prints the totals on every build. `python3 scripts/latin_unlinked.py` writes `notes/coverage/unlinked.md`: the words without an entry by likely lemma (the list for new records), the forms not reached although the word has an entry, the words found only without their macrons, the names, and the ambiguous forms. Run it after adding records.

## Word families

The page for *acrobat* gave *petaurista* and did not lead to *petaurum*, which the lexicon has under *trampoline* (Jack, 13 November 2026). A word's **family** is the other headwords of the lexicon made from the same root: *petaurum, petaurista, petauristārius*. The builder works the families out from the dictionary forms alone, with the stems the linker reads from them, and shows them in two places:

- on a Latin word's page, after "In this lexicon": a line "Same family:" with the words, each a link to its page, each with the English it is entered under: *petaurum* (trampoline), *petauristārius* (acrobat). A head that is two words (*volō, velle* and *volō, volāre*) has a line for each, named by its dictionary form;
- on a concept's page, under its answer: the family of that word, each with links to the concepts where it is entered (*acrobat* leads to *trampoline*). A word entered only on that page is not repeated, and of a large family the nearest eight are shown, with a link to the word's own page for the rest. "See also" stays as it is, at the foot of the entry; the labels tell the two lines apart.

A phrase has no family, a word is not listed in its own, and a word alone has no line. The words are in the order of nearness: those a word is made from or that are made from it, then theirs.

**A wrong family is worse than none**, as a wrong link is. Latin is full of look-alikes (*malus, mālum, mālus*; *os, ōs*; *populus, pōpulus*; *aurum, auris, aura*), so the method (`family_edges` and `join_families` in `scripts/build.py`) is narrow on purpose:

- **Stems are compared with their vowel lengths**, never folded: *populāris* is of *populus*, and *mālum* is no kin of *malus*.
- **A word B is joined to a word A** when a stem of B is a stem of A with a suffix of the list, or with a prefix of the list before it, or is A's supine stem in another kind of word (*cursus* from *currō, cursum*; the frequentative *cantō* from *canō, cantum*). The stems are a noun's or adjective's (from the genitive), a verb's present stem without its vowel (*am-, mon-, reg-, aud-*) and its supine stem (*amāt-, āct-*).
- **The suffixes** (`FAMILY_SUFFIXES`), each only on the kind of word it is mostly made from. On a noun: *-ārius, -ālis, -āris, -ōsus, -ulus/-olus, -iculus, -ista, -īnus, -eus, -āceus, -icus, -āticus, -īlis, -ānus, -iānus, -ēnsis, -ātus, -ētum, -īvus, -fer, -ger, -igāre*. On an adjective: *-ulus, -tūdō, -itia, -ēscere*, and the adverbs in *-ē, -iter, -er*. On either: *-ia, -ium, -tās*, the verbs in *-āre* and *-īre* (*cūrō* from *cūra*), *-icāre, -ificāre, -itus, -ātim*. On a present stem: *-bilis, -mentum, -men, -culum, -bulum, -āx, -āns/-ēns, -antia/-entia*, the gerundive, *-idus* and *-or* (of the second conjugation only), *-ulus, -ium, -ēla, -ilis, -uus, -ēscere, -itāre*. On a supine stem: *-tor, -trīx, -tiō, -tūra, -tōrius, -tīvus, -tilis, -tīcius, -turīre*. On a nominative: *-culus* (*jūsculum*).
- **The prefixes** (`FAMILY_PREFIXES`), each in its assimilated forms and only before the letters that form stands before: *ad-, con-, dē-, ex-, in-, ob-, per-, prae-, prō-, re-, sub-, trāns-, ab-, dis-, inter-, intrō-, circum-, sē-, super-, ante-, post-, praeter-, subter-*. A compound verb must be of the same conjugation as its simple verb, and where both give a supine the supines must agree too (*dēserō, dēsertum* is not from *serō, satum*). After a prefix the first vowel of a verb may be weakened (*faciō, cōnficiō, cōnfectum*; *caedō, occīdō*; *claudō, inclūdō*); a noun or adjective must stand as it is.
- **The root has at least three letters** (`FAMILY_MIN_ROOT`). A shorter root joins nothing, but it counts against another derivation: *redoleō* could be *re-* before *doleō* only if it could not also be *red-* before *oleō*.
- **A word the rules would derive from words of several families is joined to none**: *crēta* looks like the participle of *crēscō* and of *cernō*, and is neither.
- **A name is joined only to names** and a common word to common words: *Crētēnsis* is of *Crēta*, not of *crēta*.
- **One word under two heads is one word**: the same stem in the same declension or conjugation (*fīnēs* beside *fīnis*, *vincor* beside *vincō*), the same stem in two words entered under one concept (*cerva, cervus*), an adjective used as a noun under the same head (*amīcus*).

### `data/families.json`

What the method cannot see is kept by hand, each entry with a `note` of its authority (Lewis & Short's derivation, or de Vaan where Lewis & Short is silent). The builder refuses a word the lexicon does not have, an entry without a note, and a family joined by hand against a pair listed apart.

- `apart`: `{"words": [a, b], "note": …}`: two words never to be in one family (*calamitās* and *calamus*, *lātus*, wide, and *ferō, lātum*). The derivation of one from the other is not made, and no later join brings them together.
- `together`: `{"words": [a, b, …], "note": …}`: a family the method cannot see, because the form is irregular or the root too short (*absēns* with *absum*, *nōlō* and *mālō* with *volō*, *inimīcus* with *amīcus*, the compounds of *dō*).
- `homographs`: `{"word": head, "concepts": […], "note": …}`: the terms of these concepts are another word than the rest under the same head with the same forms (*jūs*, broth, beside *jūs*, law). The two are never joined, and a word made from *jūs* is joined to neither until a `together` says which.

A word is named by its head; where the head is several words, by the head and a concept it is entered under: `volō@fly`, `jūs@soup`.

The pairs and families in the file came out of reading every family the method proposed against Lewis & Short, and two seeded samples checked pair by pair (`notes/families-2026-11-15.md`). `python3 scripts/family_sample.py` draws such a sample again, with Lewis & Short's bracketed derivation beside each word; `--list` prints every family, `--ambiguous` the words left out because their bases are in several families, and `--word petaurista` one family with the derivations that made it. After adding many records, read the new families (`--list`, compared with the last run) before publishing: a new look-alike goes into `apart`.

The request is the editor's (13 and 15 November 2026); the method, the lists, the minimum and the number of words a concept's page shows (`FAMILY_SHOWN`) are Claude's, for him to judge. Nearby concepts (acrobat, juggler, circus), which "See also" lists by hand, are a separate thing and still to do.

## Notes (footnotes)

Wherever a record departs from Lewis & Short or from one of its sources, a note says so, with the evidence. Terms and phrases cite notes by key; the builder numbers them in reading order and prints them beside the line that cites them (on a card, under it). Every note must be cited, and every cited key must exist. A note that applies a ruling names it, and the note links to the ruling.

A note on a form (a vowel length, a spelling) has a fixed shape, so that hundreds of them read alike and none opens with “Why *abc*, not *ābc*?” (Jack, 9 November 2026). The builder prints

> **fortasse**: short final e (Lewis & Short *fortassē*, without evidence). Catull. 85.1, … the fifth foot, *-tasse re-*, is a dactyl. Also Hor. S. 1.3.20, 1.6.98. De Vaan 236, s.v. *fors*: “short final vowel”.

from four fields:

- `form`: the form as we write it (rich text).
- `claim`: what we write, in a few words: `short final e`, `long o`, `short a, double c`, `long a before ns`. No full stop.
- `against` (optional): the authority we depart from and its form, with a word on why it fails if that is short: `Lewis &amp; Short <span lang="la">fortassē</span>, without evidence`; `Lewis &amp; Short leaves it unmarked`.
- `html`: the evidence only, in citation style: the passage and what it proves, the etymology, the dictionary and page. It doesn't repeat the claim. Latin in it is marked `<span lang="la">` and prints in italic.

A note on anything else (usage, a sense, a source's error) is plain `html`, written the same way: the point first, then the evidence. A ruling keeps the full argument; the note gives the reader what they need on the spot.

The notes answer the reader who asks why we differ from a dictionary, and they let us trace a mistake to the decision that caused it.

## Rulings: `data/rulings.json`

A ruling is a recorded decision: a rule for many words (consonantal j, which authority settles a vowel), or a choice on one word where we depart from a dictionary or a source (*lutra*, *fortasse*). Each has `id`, `kind` (`orthography`, `quantity`, `usage`, `word`), `title`, `decision` and `html` (the reasons, with citations), `date` (YYYY-MM or YYYY-MM-DD), `by`, `status` (`current`, `provisional` until confirmed, `withdrawn`), and optionally `forms` and `history` (dated changes). `rulings.html` lists them by kind, with the records that cite each one; `how-we-decide.html` links to it.

Change a ruling by editing it and adding a `history` line; withdraw it rather than deleting it, so that its trace remains.

## Checks

`python3 scripts/build.py` validates records and rulings (fields, slugs, statuses, periods, no coinage of ours recommended beside an attested recommended term, notes cited and defined, rulings and related targets that exist, replaced entries that are really gone) and `data/families.json` (every word named is a word of the lexicon, every entry has its note), and checks every link between the generated pages. A renamed category keeps its old ID in `aliases` in `data/catalog.json`, so old links still land on it. `--check` also fails on a stale or leftover page in `c/` or `l/`, or a leftover font in `assets/fonts/`. `scripts/consonantal_j.py` covers records and rulings. The tests include records, notes, pages and the rulings page.

## Converting a grouped entry

Batches of cards are converted with `scripts/convert_cards.py` from a spec in `notes/conversions/`; `docs/converting.md` gives the rules for splitting a card and filling the fields, and the checks the script makes. The converted records are drafts until a person has read them against the old card.
