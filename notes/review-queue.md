# Questions for review

Every record converted from the cards or drafted since is on the site and marked *Draft*. Most need only reading. The points below need a decision first. Each names the records concerned and the pull request where the evidence is set out. Collected on 9 November 2026 from the pull requests' "For your review" sections. Once a point is settled, delete it here; a ruling that applies across the house goes in `data/rulings.json`.

Records: `https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/c/<id>.html`. Pull requests: `https://github.com/jhwheeler/lexicon-latinitatis-cotidianae/pull/<n>`.

## Vowel lengths that want a house ruling

- ***heri* or *herī*.** `yesterday` writes *heri*: de Vaan 283 explains it as shortened from *herī*, which Terence has once. `yesterday-morning`, `yesterday-evening` and an example in `courier` write *herī*, as Traupman 89 and the readers do. (#54)
- ***re-* before *s* and a consonant.** `answer` (*respondeō, respōnsum*) and `remain-stay` (*restō*) write a short *re-*, after de Vaan 516. Lewis & Short's *rē-* marks the heavy syllable, not a long vowel. (#56, #60)
- ***sēsquihōra* or *sesquihōra*.** De Vaan derives *sēsque-* from *\*sēmis-que*, and Traupman 87 prints *sēsqui-*. The readers and Lewis & Short leave the vowel unmarked. (#40)
- **Lachmann's law.**
  - *frāctus* and *frāctūra* are written long (`broken`, `fracture`; #57, #60), and so are *dēlēctus* and *ēlēctiō* (#65).
  - *contractus* and *pactum* are written short (`contract`, `agreement`; #61). The short *pactum* fits de Vaan's root *\*pak-*, but *trahō* has a voiced root, so *trāctus* may be due.
- **Final *o*.** *aliquandō*, *immō*, *porrō* and *quandō* are written long, after de Vaan; *aliquandō* may want a ruling of its own. (#53)
- ***coërceō*** is written with a diaeresis, like the house's *āër* (`control-restrain`). (#60)
- **Greek words.**
  - *episcopus* and *epistola* have a short *i*, from Greek ἐπί (`bishop`, `epistle`).
  - *alleluja* has a short *e* (Prud. Cath. 4.72), against Lewis & Short's *allēlūja*.
  - *baptīzō* follows Lewis & Short and Morgan–Owens, though the Greek ι is short.
  - *acadēmīa* has a long *ī*, after Lewis & Short and Cicero's verse, against Traupman and Morgan–Owens.
  - *Paraclītus* follows the Clementine spelling.
  - (#58, #60, #61)
- **Single words with notes:**
  - *hic* has a short *i* (de Vaan 284; #63).
  - *speī* has a short *e* (#55).
  - *puta* has a short *a*, as Lewis & Short print it, against Traupman (#55).
  - *lucrum* has a short *u*, against Traupman's *lūcrum* (#61).
  - *repente* has a short final *e* (#62).
  - *successus* has a short *e*, against Traupman's *succēssus* (#65).
  - *pictūra* has a short *i*, against Traupman's *pīctūra* (#49).
  - *camīsula* has a long *i* (`t-shirt`; #34).
  - *pappa* is written with a double *p* and a short *a* (#48).
  - *acroāsis* has a short first *a*, from Greek ἀκρόασις, against Lewis & Short's *ācroāsis* (`lecture`; #65).
  - *glōssārium* has a long *ō*, from Greek (`dictionary`; #65).
  - *exīstimō* is left out until its first vowel is settled (#55).

## Recommended words to confirm

- **Leading term:**
  - `big` now leads with *magnus*, before *grandis* (#57).
  - `wake-someone-up` recommends *expergēfaciō*, but *excitō* is Cicero's and Livy's word (#59).
  - `building-site` recommends our own *locus ubi aedificātur*, with the classical *ārea* only as an alternative (#60).
  - `chapel` marks the medieval *capella* "avoid" and recommends *sacellum* (#60).
- **Traupman's modern sense of a classical word:**
  - `office-workplace` uses *officīna*, classically a workshop (#60).
  - `education` recommends *īnstitūtiō* over *ēducātiō*, which is upbringing (#61).
  - `university` recommends *ūniversitās studiōrum* over *acadēmīa* (#61).
- **Other choices:**
  - `next-year` recommends *ad annum* (Cic. Att. 5.2.1), because Traupman's *proximō annō* can mean last year (#60).
  - `council` recommends *senātus* over Traupman's *decuriōnēs* (#63).
  - `strike` now covers hitting people too; a separate *hit* record under common words may sit better (#59).
- **School:**
  - `conjugation` recommends *conjugātiō*, which is late (Diomedes, Priscian; earlier grammarians said *dēclīnātiō*), because "first conjugation" needs it. The brief wrongly put it in Varro and Quintilian.
  - `adjective` recommends Quintilian's *appositum* over the late *adjectīvum*.
  - `pencil-sharpener` recommends Morgan–Owens's *cōticula*, classically a touchstone, over Traupman's *īnstrūmentum cuspidārium*.
  - `recite` recommends *reddō* (Hor. Ep. 1.18.14) and `lecture` recommends *schola* (Cic. Tusc. 1.7), rather than Traupman's *recitō* and *acroāsis*.
  - `times-table` uses our own *tabula multiplicātiōnis* (#65).
- **The last words of ranks 501–1000:**
  - `department` recommends *prōvincia* (Ter. Ph. 72–73), because classical Latin has no word for a division of an organization.
  - `agent-representative` recommends the classical *prōcūrātor* (Cic. Caecin. 57).
  - `target-mark` labels *scopus* modern (Traupman 45): Lewis & Short's one classical instance reads *prō scopulō* in Ihm's text.
  - `round-game` recommends *missus* (Suet. Dom. 4.3).
  - *quālitās* means a trait classically (Cic. Ac. 1.25), but `quality-assurance` and the computing records use it for "how good".
  - "street" is a search word of `road` (*via*, *vīcus*); it may deserve a record of its own, with *platea*, the street of comedy (#66).
- **Money:**
  - Should *wealth* have a record of its own led by *dīvitiae*? Today it sits in `resources`.
  - `pension` recommends the classical *annua* (an annual stipend), with Levi–Bini's *beneficium annuum* as the modern form.
  - `salary` prefers *salārium* to Traupman's *mercēs*.
  - `employer` (*conductor*), `haggle` (*dē pretiō pacīscī*, Suet. Gram. 7.2) and `budget` (*ratiō impēnsārum*, Suet. Ner. 30.1) are thin.
  - `cash-machine` uses our own *māchina nummāria*.
  - `insurance` (*cautiō*) is labelled modern (#65).
- **From the converted cards:**
  - `shirt` recommends *subūcula*, which is the undershirt (#34).
  - `pillow`: *pulvīnus* or the readers' *cervīcal* (#32).
  - `refrigerator` and `freezer`: *arca gelātōria* or the readers' *capsa frīgorifica* (#30, #37).
  - `slide`: *tractus lūbricus* or the readers' *tabula dēclīvis* (#33).
  - `shoelace`: *vincula calceōrum* or *corrigia* (#34).
  - `apron`, `sauce`, `napkin`, `pancake` (#37).
  - `delicatessen`: is *cuppēdināria* a cake shop or a delicatessen? (#35)
  - `storeroom` has two recommended terms.
  - The leading form for `tape-measure`, `insulation`, `build-up`, `scaffold-pole`, `base-plate` and `coupler` (#28, #29).
  - `tuna`: the cards' *thynnus*, against *thunnus* (#38).
  - `rim` and `tyre`: the cards disagree on *canthus* (#36).

## Periods and labels

- **Christian terms dated medieval without a source:** *Ascēnsiō*, *Adventus*, *Deī Genetrīx* and *Fēria VI in Parascēvē* are probably older (#58).
- **Composed phrase terms dated modern for want of an ancient instance** (#39).
- **`jelly`** needs a sense label, now that `jello` holds the dessert (#49).
- ***sociālis*** for "social" is Seneca's sense; classically it means "of allies" (#53).

## Records to keep or drop

- **`totoro`:** a character's name as a headword (#39).
- **`osoitsa`, `antanhol`:** the family's villages, in a public lexicon (#35).
- **Animal sounds:** quack, hoot and cackle recommend *clāmat*. Do they need records of their own? (#38)

## Slips in the loci collections (latinitas)

The drafters found these while checking quotations. Nothing here quotes the faulty rows.

- **loci-seneca-epistulae:** Ep. 72.8 prints *frūsta*; the series spelling is *frustum*. (#53)
- **loci-terentius:** the Eun. 190–91 row drops words without an ellipsis. (#53)
- **loci-horatius:**
  - S. 1.5.88 *venit* should be *vēnit* (from *vēneō*), as the metre needs. (#54)
  - S. 1.1.26 *crūstula*: the house spelling is *crustula*. (#63)
  - The Epist. 1.16.55–56 row stops before *mihi pacto lenius isto*, so its gloss says the opposite of Horace. (#64)
- **loci-plautus:** Amph. 310 *esse* should be *ēsse*, "eat". (#54)
- **loci-schottenius:** *succincta* should be *succīncta*. (#58)
- **loci-augustinus:** *Mediolānium*; Lewis & Short has *Mediōlānum*. (#60)
- **loci-vulgata:** Lc. 15.22 *Citō*; Lewis & Short has *citŏ*. (#60)
- **loci-ovidius:** Met. 6.350 *āera*; the house writes *āëra*. (#57)
- **loci-livius:** praef. 1 *facturusne* should be *factūrusne*. (#65)
- **loci-comenius:** OP 126 lacks the macrons on *Vēnditor* and *Ēmptor*. (#65)
- ***fūrtum*:** the loci write it long, but de Vaan (s.v. *fūr*, after Forssman) gives *furtum* a short vowel. (#64)
