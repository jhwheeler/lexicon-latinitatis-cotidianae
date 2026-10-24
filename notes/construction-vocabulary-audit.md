# Construction, tools and house-layout vocabulary audit

Reviewed 24 October 2026. This addition starts from current `main` at
`3d837af4c017f4935d0155d525048076c0c20081`, including the recent programming
and QA additions. All 141 existing grouped entries are retained.

The change adds 17 grouped entries (142–158), extends the existing workshop
section, and adds **Aedificātiō et materiae** and **Domūs partēs et supellex**.
English–Bulgarian glosses are added to 13 relevant existing entries (57, 81,
86–89, 97–103). New entries provide English and Bulgarian meanings alongside
Latin, noun genitives and genders. Bulgarian search uses the existing search
implementation; no translation service or runtime dependency was added.

## Sources consulted

- John C. Traupman, *Conversational Latin for Oral Proficiency*, the user's
  uploaded PDF, searched and read directly. **Printed page numbers** are used
  below; this copy's PDF page number is one higher.
  - pp. 122–125: attic, armchair, bucket, ceiling, doors, living room, roof,
    roof tile, sofa and storey.
  - pp. 162–163: the house-building dialogue, checked alongside the vocabulary.
  - p. 165: builder, bricklayer, carpenter, hand tools, nail, plane, ruler,
    square and pliers.
  - p. 168: concrete, mortar, lime (under an overly broad English “cement”
    gloss), plummet, trowel, plaster and plasterer.
  - p. 278: beam (*trabs*); p. 281: wooden board (*tabula*).
  - p. 309: **fūniculus ēlectricus**, electric cord.
  - p. 375: screw; the book's screwdriver spelling in this copy was not
    substituted for the repository's already supported **vertitōrium**.
- [Morgan–Owens Neo-Latin Lexicon](https://neolatinlexicon.org/): the individual
  entries linked in the HTML were read for **trowel, spatula, crowbar, cable,
  spool/reel/bobbin, reel, screwdriver, power drill, tape measure, measuring
  stick/meter rule/tape measure, insulation, furnished attic, garret/attic room,
  studio, cement**. Citations to Levine, Helfer and Eichenseer are reported
  through Morgan–Owens, not presented as independent readings of those books.
- [Older Morgan draft, text edition](https://archive.org/stream/TheLexiconAnglumEtLatinumByDavidMorgan/MorganAndSilvaFurmanUniversityLexicon_djvu.txt):
  its warning under **attic** about the uncertain sense of *subtegulaneus*
  in Pliny was checked, rather than projecting the modern dictionary sense
  backwards without qualification.
- Lewis & Short through [Alatius](https://www.alatius.com/ls/): readable entries
  were obtained for **forceps, trulla, cochlea/coclea, spatula, tabulatus,
  vectis, lamina, forfex, fastigium, trabs, fundamentum, supellex, reficio,
  diruo, extollo, norma, metior, harena, runcina, perpendiculum, sucula**.
  The *fusus* request returned an inflected-form search including *fundo*;
  the spool/reel sense is grounded in Morgan–Owens, not that unrelated
  pouring entry. Other component-word links aid further reading; failed
  requests are not represented as inspected evidence.
- **Smith & Hall, “trowel”** was inspected through Latinitium's own dictionary
  data (`sh26271`): it gives *trulla*, citing Palladius 1.15, and *trullisso*
  for plastering. The entry link is provided in the HTML. Dynamic web search
  did not expose its text, so the actual entry data was checked.
- [Palladius, *Opus agriculturae* 1.13.2 and 1.15](https://la.wikisource.org/wiki/Opus_agriculturae/I):
  direct late antique building context for *trulla* and *tectorium*.
- [Vatican, *Parvum verborum novatorum lexicum*](https://www.vatican.va/roman_curia/institutions_connected/latinitas/documents/rc_latinitas_20040601_lexicon_it.html):
  the public abridgement gives **cemento — lithocolla**. The full printed
  *Lexicon Recentis Latinitatis* was not consulted. No exact extension-lead
  or cable-reel term was verified there.
- [Sim and Legg, “The Production of Roman Metal Screw Threads,” EXARC (2023)](https://exarc.net/issue-2023-2/ea/production-roman-metal-screw-threads):
  archaeological evidence for wooden and metal screw mechanisms, including
  fastenings. This supports the historical explanation; it does not establish
  that every modern screw subtype had one ancient Latin equivalent.

No automatically translated industrial catalogue was used as Latin evidence.
Bulgarian meanings are editorial translations into ordinary Bulgarian trade
usage; manufacturer and native Bulgarian product descriptions corroborate the
specialized shear attachment's identity and name.

## Coverage and editorial decisions

| Entry | Coverage | Evidence boundary |
| --- | --- | --- |
| Existing 97–103 | Nail, screw, screwdriver, wrench, drill, pliers/pincers, ruler, level, tape measure, wall plug | Extend existing entries instead of duplicating them. Add **taenia mēnsūrālis** and Bulgarian glosses. Preserve recorded quantity variants in *cochlea* and *terebra*. |
| 142 | Trowel, notched trowel, broad skimming/taping blade | **Trulla** is attested in an actual plastering context. **Trulla dentāta** and **spatula tēctōria** are our descriptions of modern shapes/functions. |
| 143 | Carpenter's plane and square | **Runcīna** and **nōrma** follow Traupman's tool vocabulary. The square's function is distinguished from a level. |
| 144 | Crowbar / pry bar | **Vectis, vectis m.** is explicitly ancient in the prying/demolition sense. Bulgarian **кози крак**, more generally **лост**. |
| 145 | Electrical cord and extension lead | **Fūniculus ēlectricus** is explicitly in Traupman. **Fūniculus ēlectricus prōlongātōrius** is our working formation for the extension function. |
| 146 | Reel, winding, unwinding; ancient windlass comparison | Morgan–Owens records **fūsus** for a reel. **Fūsus fūniculī ēlectricī** is our compositional cable-reel phrase. Ancient **sucula** denotes a hauling mechanism, not evidence for a portable storage reel identical to the modern item. |
| 147 | Metal shears and the photographed drill attachment | **Forfex** and **lāmina** have ancient relevant senses. The purpose phrase and attachment description are ours. |
| 148 | Bucket and plumb bob/line | **Situla**, **perpendiculum**; link to the existing **scālae** entry for a ladder. |
| 149 | Builder, craftsman, carpenter, bricklayer, plasterer, architect | Traupman and ancient lexical bases; modern trade boundaries are context-sensitive. |
| 150 | Brick, stone, timber, board, beam | Ancient material/tool vocabulary, with Bulgarian construction meanings. |
| 151 | Plaster, lime, sand, mortar, cement, concrete | Distinguish **calx** (вар), **lithocolla** (цимент), **concrētum** (бетон) and mortar (строителен разтвор / хоросан). Do not turn ancient *caementum* or *calx* into an unqualified modern shopping equivalent. |
| 152 | Insulation and insulation board | Morgan–Owens records **insulatio**; the thermal qualifier and heat-retaining-board description are explicitly ours. Do not infer a particular EPS/XPS product solely from that functional term. |
| 153 | Building site, foundations, building, repair, demolition | Ancient nouns/verbs; the site relative clause and examples are composed. |
| 154 | Roof, tile, gable, two roof slopes | **Tēctum, tēgula, fastīgium**; gable-roof shape is described rather than declared a verified fixed expression. |
| 155 | Storey, top floor, attic/loft, upstairs | **Tabulātum** has an ancient storey sense. **Subtēgulāneum** is supported by modern lexicography with the ancient-meaning caveat retained. A habitable loft is not defined as a storeroom. |
| 156 | Low side wall/knee wall, height, raising the walls/roof | Descriptive **pariēs humilis**; no universal equivalence asserted between an exterior Bulgarian **надзид** and an internal attic partition. |
| 157 | Door, window, ceiling, flooring cross-reference | Explain Bulgarian **таван** as both ceiling and attic in different contexts; **lacūnar** is specifically a panelled/coffered ceiling. |
| 158 | Living room, artist's studio, furniture, armchair, sofa | Traupman's room/furniture phrases; **officīna artificis** in Morgan–Owens; **supellex** as a collective ancient noun. |

## Photographed DeWalt accessory

The yellow attachment was first tentatively misidentified in conversation as a
screw-feed magazine. Comparison with product images corrects it to a
**DT70620-style sheet-metal shear attachment**. Its hex shank is driven by a
drill/impact driver, and the long arm/bracket stabilizes the attachment.

- [Manufacturer description and product image](https://www.dewalt.co.uk/en-gb/product/dt70620-qz/extreme-18ga-hex-impact-shear-attachment)
- [Bulgarian description](https://bauhaus.bg/pristavka-za-vintovert-dewalt-dt70620-qz/p/176971):
  **приставка за винтоверт за рязане на ламарина**.

No unverified screw-feeder entry was added on the basis of that image.

## Pronunciation, grammar and translation

- Preserve existing quantity variants instead of silently replacing them with
  one conversational form. Supply inherited roots and productive endings for
  descriptive phrases; no certainty is claimed for unmarked modern loan stems.
- Correct the affected measuring example to **Rēgulā mētīre**, and use
  **mētiāmur** with long initial ē. Correct **fīge** in the nail example.
- **Forceps** is singular for one pair; masculine and feminine are both
  attested. Distinguish **forfex** (cutting shears) from **forceps** (gripping).
- **Forfex ad lāminās metallicās secandās**, **trulla dentāta**,
  **spatula tēctōria**, the extension-lead and cable-reel phrases, insulation
  qualifiers and roof-shape descriptions are not mislabelled as independently
  attested complete technical names.
- Every example sentence and Bulgarian rendering is newly composed; none is
  presented as a quotation from Traupman or an ancient author.

## Validation

Validated with a parsed HTML DOM and the actual embedded search script:

- All 141 prior IDs remain; all 17 new IDs are unique (158 total).
- All new and affected entries have source blocks. Two untouched baseline
  entries have no source block; this addition does not change them.
- All 12 category counts and the hero total agree with the DOM.
- The embedded script parses and executes; both new category filters, the
  empty state and Clear control work.
- Seventeen English, macron-insensitive Latin and Bulgarian search queries
  retrieve the expected entries, including кози крак, ролетка, макара,
  удължител, ламарина, subtegulaneum and taenia mensuralis.
- New internal entry links resolve, and git diff --check passes.

Full browser rendering and mobile screenshots were not completed: the runtime
had no Chromium executable and its browser download failed. The existing CSS
and search implementation are retained.

This is a pull request only. GitHub Pages deployment is checked after a future
merge/publish, not represented as completed while the branch remains unmerged.
