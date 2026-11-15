# Missing common Latin words: what was done, batch by batch

The lexicon is measured against `refs/latin-frequency.tsv`, the 5,000 most frequent lemmas of the LASLA corpus (`scripts/latin_coverage.py`; the report is `latin-frequency.md`). This file records, lemma by lemma, how each gap was closed or why it was left.

## Batch 1: general vocabulary, the first 2,000 (15 November 2026)

Scope: every lemma of the first 2,000 that the coverage script reported as not covered on that day (178 lemmas), except the fields two other passes were working on at the same time (outdoor and garden words; the comic poets’ household, family and quarrel words).

Result: 172 Latin words entered. 85 of them stand in 80 new records; 87 were added as terms to 75 records that already covered their meaning. Six lemmas were not entered (below, in the table). By the script’s count after this batch, 3 of the first 2,000 are not covered (*resistō*, *arvum*, and the neuter plural *praesentia*), and 1,218 of the first 5,000.

How each word was checked:

- The sense, the principal parts and the vowel lengths come from the word’s article in Lewis & Short, read with `scripts/lookup.py ls`. Hidden quantities follow the house rules (*ōrnō*, *mōnstrum*, *fēstus*, *conjūnctus*, *redāctum*, *redēmptum*, *vīnctum*, *ārdor*).
- Each term carries one or two of Lewis & Short’s own citations as evidence, in house form and marked “(Lewis & Short)”. A quotation marked so keeps the dictionary’s wording, with house macrons and j.
- Each word has an example containing one of its forms: a line from the Latinitas loci collections (cited plainly; the record’s sources say so), or a quotation from Lewis & Short.
- Before a new record was written the lexicon was searched for the English meaning, by headword and by the “also” words. Where a record already answered it, the word went there with a gloss that tells it apart.

Things to look at again:

- **Other passes’ fields.** These additions touch words near the household and outdoor fields and may meet the other agents’ work at the merge: *torus* (in `bed`), *thalamus* (`bedroom`), *genitor* (`father`), *paternus* (new `paternal`), *prōlēs* (new `offspring`), *altum* (`sea`), *aethēr* (`sky`), *astrum* (`star`), *verbera* (`whip-lash`), *cinis* (new `ashes`), *cavus* (new `hollow`), *saeviō* and *saevitia* (`cruel`), *stuprum* (`rape`).
- **vallum** is written with a short *a*, as the lexicon writes *intervallum*; Lewis & Short and de Vaan print no long mark. Bennett was not checked.
- **Citations as Lewis & Short prints them.** Where the dictionary’s reference looked wrong against the usual numbering, another citation was used: Livy “1, 16, 10” for *incēdō*, Caesar “B. G. 5, 44, 4” for *ergā*, Suetonius “Aug. 52” for *admittō*, Caesar “B. G. 1, 10” for *indulgeō*. Cicero’s references with a chapter number only were avoided for the same reason. The citations that were used have not been checked against the texts themselves.
- **Evidence without a quotation.** For *linquō*, *aevum*, *aethēr*, *cavus*, *prōlēs*, *thalamus*, *genitor*, *mōnstrum*, *pontifex* and *astrum* the evidence is Lewis & Short’s bare references (mostly verse); the example comes from the loci collections.
- **Two loci lines respelt.** *ārdor* (Gell. 19.1.7, where the loci file prints *ardor*) and *adēmptum* (Verg. A. 3.658, where it prints *ademptum*), to agree with the lexicon’s *ārdeō* and *adimō, adēmptum*.
- **Register labels** (*torus*, *thalamus*, *lētum*, *astrum*, *merum*, *prōlēs*) follow Lewis & Short’s “poet.” or “mostly poet.”; the authors named are among those it cites.
- **English headwords that are phrases** are choices that may want changing: “at public expense” (*pūblicē*), “the gods above” (*superī*), “endowed with” (*praeditus*), “examine closely” (*perspiciō*), “beg off” (*dēprecor*), “bring near” (*admoveō*), “send in” (*immittō*), “run together” (*concurrō*), “draw together” (*contrahō*).
- **serviō** was a term to avoid in `serve` (at table) and still is; the word itself now has its own record, `serve-be-a-slave`.
- **fortify** holds the verb and its nouns in one record (*mūniō*, *mūnītiō*, *vallum*), as the brief asked for war words.
- **Aliases in the coverage script.** `ALIASES` in `scripts/latin_coverage.py` now maps the corpus’s *ample* to *amplius*, *pudeo* to *pudet*, *spons* to *sponte*, *potis* to *potior* and *suum* to *suus*, as it already maps *boni* to *bonus*. If these should stay on the list as gaps, take the line out.

| Rank | Lemma | What was done |
| ---: | --- | --- |
| 886 | resisto | left out: the Perseus copy of Lewis & Short has no article *resistō* (neither XML edition, nor the JSON made from it), and no other copy could be read from here (Logeion, the Perseus Hopper, the Berlin CLD and lsj.gr are closed to this session; the alatius.com page returned other articles). The Scaife ATLAS page gives only the short definition of Lewis’s *Elementary Latin Dictionary* (“to stand back, remain standing, stand still, halt, stop, stay”), without quantities or citations, which is not enough to enter the word. |
| 1001 | excutio | added to `shake` (shake) as *excutiō*. |
| 1014 | divinus | new record `divine` (divine): *dīvīnus*. |
| 1029 | natio | added to `race-people` (race) as *nātiō*. |
| 1031 | reor | added to `think-believe` (think) as *reor*. |
| 1058 | recedo | new record `withdraw` (withdraw): *recēdō*. |
| 1063 | memoro | added to `mention` (mention) as *memorō*. |
| 1064 | servio | new record `serve-be-a-slave` (serve): *serviō*. |
| 1066 | indignus | new record `unworthy` (unworthy): *indignus*. |
| 1083 | ignarus | added to `ignorant` (ignorant) as *ignārus*. |
| 1088 | ample | not entered: the corpus’s lemma for the adverb whose forms are *amplius, amplissimē, amplē*; the lexicon has *amplius*. The coverage script now counts it (ALIASES). |
| 1092 | admoveo | new record `bring-near` (bring near): *admoveō*. |
| 1096 | aeternus | new record `eternal` (eternal): *aeternus*. |
| 1100 | impius | new record `impious` (impious): *impius*. |
| 1111 | torus | added to `bed` (bed) as *torus*. |
| 1113 | admitto | new record `admit-let-in` (admit): *admittō*. |
| 1126 | pudeo | not entered: the lexicon has the impersonal *pudet* (record `im-ashamed`), the only form in ordinary use (Lewis & Short: “in the verb. finit. extremely rare”). The coverage script now counts it (ALIASES). |
| 1134 | violo | new record `violate` (violate): *violō*. |
| 1149 | contumelia | added to `abuse-insults` (abuse) as *contumēlia*. |
| 1154 | exsilium | added to `banish` (banish) as *exsilium*. |
| 1160 | vincio | added to `tie` (tie) as *vinciō*. |
| 1169 | vastus | added to `huge` (huge) as *vāstus*. |
| 1186 | orno | new record `decorate` (decorate): *ōrnō*. |
| 1188 | arvum | left to the agent working on outdoor words (a ploughed field). |
| 1195 | exitium | added to `destroy` (destroy) as *exitium*. |
| 1197 | libertus | new record `freedman` (freedman): *lībertus*. |
| 1212 | removeo | added to `remove` (remove) as *removeō*. |
| 1219 | consultum | added to `senate` (senate) as *cōnsultum*. |
| 1221 | paternus | new record `paternal` (paternal): *paternus*. |
| 1227 | munitio | new record `fortify` (fortify): *mūnītiō*. |
| 1228 | purus | new record `pure` (pure): *pūrus*. |
| 1244 | meritum | added to `earn-deserve` (earn) as *meritum*. |
| 1247 | reduco | new record `bring-back` (bring back): *redūcō*. |
| 1258 | publice | new record `at-public-expense` (at public expense): *pūblicē*. |
| 1270 | aevum | added to `age` (age) as *aevum*. |
| 1274 | sono | new record `sound-verb` (sound): *sonō*. |
| 1277 | concipio | new record `conceive` (conceive): *concipiō*. |
| 1280 | oppono | added to `oppose` (oppose) as *oppōnō*. |
| 1284 | hasta | new record `spear` (spear): *hasta*. |
| 1288 | servitus | added to `slave` (slave) as *servitūs*. |
| 1316 | ornamentum | new record `ornament` (ornament): *ōrnāmentum*. |
| 1317 | triumphus | new record `triumph` (triumph): *triumphus*. |
| 1331 | vallum | new record `fortify` (fortify): *vallum*. |
| 1336 | educo | new record `lead-out` (lead out): *ēdūcō*. |
| 1350 | averto | new record `turn-away` (turn away): *āvertō*. |
| 1367 | expeto | added to `desire` (desire) as *expetō*. |
| 1373 | sestertius | new record `sesterce` (sesterce): *sēstertius*. |
| 1384 | memor | new record `mindful` (mindful): *memor*. |
| 1394 | geminus | added to `twins` (twins) as *geminus*. |
| 1400 | nocturnus | new record `nocturnal` (nocturnal): *nocturnus*. |
| 1401 | occultus | new record `hidden` (hidden): *occultus*. |
| 1402 | supplex | new record `suppliant` (suppliant): *supplex*. |
| 1405 | consuesco | new record `get-used-to` (get used to): *cōnsuēscō*. |
| 1409 | humilis | new record `low` (low): *humilis*. |
| 1411 | vere | added to `truly` (truly) as *vērē*. |
| 1426 | munio | new record `fortify` (fortify): *mūniō*. |
| 1430 | totiens | new record `so-often` (so often): *totiēns*. |
| 1444 | seditio | new record `mutiny` (mutiny): *sēditiō*. |
| 1449 | subsidium | new record `reinforcements` (reinforcements): *subsidium*. |
| 1452 | incedo | added to `walk-verb` (walk) as *incēdō*. |
| 1455 | fortiter | added to `brave` (brave) as *fortiter*. |
| 1457 | perspicio | new record `examine-closely` (examine closely): *perspiciō*. |
| 1460 | invisus | added to `hatred` (hatred) as *invīsus*. |
| 1462 | monstrum | new record `monster` (monster): *mōnstrum*. |
| 1481 | acriter | new record `fiercely` (fiercely): *ācriter*. |
| 1487 | humor | added to `liquid` (liquid) as *ūmor*. |
| 1488 | ornatus | new record `decorate` (decorate): *ōrnātus*. |
| 1489 | spolium | new record `spoils` (spoils): *spolium*. |
| 1494 | perduco | added to `bring` (bring) as *perdūcō*. |
| 1502 | vanus | added to `worthless` (worthless) as *vānus*. |
| 1509 | sperno | added to `despise` (despise) as *spernō*. |
| 1511 | alte | added to `high` (high) as *altē*. |
| 1514 | pestis | added to `disease` (disease) as *pestis*. |
| 1516 | decima | new record `tithe` (tithe): *decima*. |
| 1517 | genitor | added to `father` (father) as *genitor*. |
| 1523 | altum | added to `sea` (sea) as *altum*. |
| 1536 | perditus | new record `depraved` (depraved): *perditus*. |
| 1537 | profiteor | new record `declare` (declare): *profiteor*. |
| 1543 | abduco | new record `lead-away` (lead away): *abdūcō*. |
| 1544 | arbitrium | new record `discretion` (discretion): *arbitrium*. |
| 1552 | tyrannus | new record `tyrant` (tyrant): *tyrannus*. |
| 1555 | thalamus | added to `bedroom` (bedroom) as *thalamus*. |
| 1556 | volvo | added to `roll` (roll) as *volvō*. |
| 1557 | conjunctus | new record `connected` (connected): *conjūnctus*. |
| 1560 | penitus | new record `deeply` (deeply): *penitus*. |
| 1563 | contraho | new record `draw-together` (draw together): *contrahō*. |
| 1570 | concurro | new record `run-together` (run together): *concurrō*. |
| 1580 | omen | new record `omen` (omen): *ōmen*. |
| 1582 | pontifex | new record `pontiff` (pontiff): *pontifex*. |
| 1586 | letum | added to `die` (die) as *lētum*. |
| 1587 | obvius | added to `meet-by-chance` (meet) as *obvius*. |
| 1590 | auspicium | new record `auspices` (auspices): *auspicium*. |
| 1595 | impedimentum | new record `hindrance` (hindrance): *impedīmentum*. |
| 1598 | cinis | new record `ashes` (ashes): *cinis*. |
| 1599 | corripio | added to `grab` (grab) as *corripiō*. |
| 1601 | furo | added to `anger` (anger) as *furō*. |
| 1611 | proicio | new record `fling` (fling): *prōjiciō*. |
| 1617 | suum | skipped: a grammatical variant, the neuter of *suus* used as a noun; Lewis & Short has no such headword. The coverage script now counts it under *suus* (ALIASES). |
| 1618 | aether | added to `sky` (sky) as *aethēr*. |
| 1621 | formido | added to `fear` (fear) as *formīdō*. |
| 1623 | linquo | added to `abandon` (abandon) as *linquō*. |
| 1625 | sceleratus | added to `evil` (evil) as *scelerātus*. |
| 1627 | equester | added to `cavalry` (cavalry) as *equester*. |
| 1630 | majestas | new record `majesty` (majesty): *majestās*. |
| 1631 | potis | new record `preferable` (preferable): *potior*. The positive *potis* is mostly ante-classical and poetic; classical prose has the comparative (Lewis & Short). The coverage script now counts it (ALIASES). |
| 1635 | severitas | added to `severe-strict` (severe) as *sevēritās*. |
| 1641 | puppis | new record `stern-of-a-ship` (stern): *puppis*. |
| 1654 | circumvenio | added to `surround` (surround) as *circumveniō*. |
| 1658 | immitto | new record `send-in` (send in): *immittō*. |
| 1667 | tolero | added to `suffer-undergo` (suffer) as *tolerō*. |
| 1671 | iners | added to `lazy` (lazy) as *iners*. |
| 1675 | ardor | new record `ardour` (ardour): *ārdor*. |
| 1676 | dimico | added to `fight` (fight) as *dīmicō*. |
| 1692 | abstineo | new record `abstain` (abstain): *abstineō*. |
| 1694 | erga | added to `towards` (towards) as *ergā*. |
| 1696 | nihilum | added to `nothing` (nothing) as *nihilum*. |
| 1698 | praetorius | added to `praetor` (praetor) as *praetōrius*. |
| 1699 | spons | added to `automatically` (automatically) as *sponte*. The list’s *spons* is a nominative that grammarians assumed; only *sponte* (and *spontis*) is in use (Lewis & Short). The coverage script now counts it (ALIASES). |
| 1701 | appeto | added to `desire` (desire) as *appetō*. |
| 1706 | contrarius | added to `reverse` (reverse) as *contrārius*. |
| 1707 | depello | added to `drive-away` (drive away) as *dēpellō*. |
| 1726 | superbia | added to `proud-arrogant` (proud) as *superbia*. |
| 1727 | verber | added to `whip-lash` (whip) as *verbera*. |
| 1729 | concupisco | added to `desire` (desire) as *concupīscō*. |
| 1747 | subduco | added to `slip-away` (slip away) as *subdūcō*. |
| 1751 | insigne | new record `badge` (badge): *īnsigne*. |
| 1753 | mergo | new record `plunge` (plunge): *mergō*. |
| 1761 | obeo | added to `die` (die) as *obeō*. |
| 1769 | concutio | added to `shake` (shake) as *concutiō*. |
| 1774 | ostento | added to `brag` (brag) as *ostentō*. |
| 1777 | trepido | added to `anxious` (anxious) as *trepidō*. |
| 1788 | saevio | added to `cruel` (cruel) as *saeviō*. |
| 1794 | vetustas | new record `antiquity` (antiquity): *vetustās*. |
| 1795 | deterior | added to `bad` (bad) as *dēterior*. |
| 1800 | pronus | new record `prone` (prone): *prōnus*. |
| 1801 | saevitia | added to `cruel` (cruel) as *saevitia*. |
| 1803 | servitium | added to `slave` (slave) as *servitium*. |
| 1804 | stuprum | added to `rape` (rape) as *stuprum*. |
| 1806 | astrum | added to `star` (star) as *astrum*. |
| 1808 | erumpo | added to `escape` (escape) as *ērumpō*. |
| 1813 | superi | new record `the-gods-above` (the gods above): *superī*. |
| 1817 | expeditus | new record `unencumbered` (unencumbered): *expedītus*. |
| 1821 | inimicitia | new record `enmity` (enmity): *inimīcitia*. |
| 1824 | pernicies | added to `destroy` (destroy) as *perniciēs*. |
| 1825 | pertimesco | added to `be-afraid` (be afraid) as *pertimēscō*. |
| 1829 | evoco | added to `get-fetch` (get) as *ēvocō*. |
| 1832 | gladiator | new record `gladiator` (gladiator): *gladiātor*. |
| 1835 | merum | added to `wine` (wine) as *merum*. |
| 1836 | regia | added to `palace` (palace) as *rēgia*. |
| 1839 | sestertium | new record `sesterce` (sesterce): *sēstertium*. |
| 1852 | concordia | new record `harmony` (harmony): *concordia*. |
| 1853 | diripio | new record `plunder` (plunder): *dīripiō*. |
| 1867 | irritus | new record `void` (void): *irritus*. |
| 1868 | liquidus | added to `liquid` (liquid) as *liquidus*. |
| 1872 | proles | new record `offspring` (offspring): *prōlēs*. |
| 1881 | adverto | added to `notice` (notice) as *advertō*. |
| 1884 | deprecor | new record `beg-off` (beg off): *dēprecor*. |
| 1885 | intereo | added to `die` (die) as *intereō*. |
| 1894 | festus | added to `festival` (festival) as *fēstus*. |
| 1900 | pavidus | added to `be-afraid` (be afraid) as *pavidus*. |
| 1901 | redigo | new record `bring-back` (bring back): *redigō*. |
| 1905 | imperitus | added to `inexperienced` (inexperienced) as *imperītus*. |
| 1911 | recupero | new record `regain` (regain): *recuperō*. |
| 1919 | submitto | added to `lower` (lower) as *summittō*. |
| 1924 | cavus | new record `hollow` (hollow): *cavus*. |
| 1927 | fletus | added to `cry-weep` (cry) as *flētus*. |
| 1930 | indulgeo | added to `humour-someone` (humour someone) as *indulgeō*. |
| 1931 | praeditus | new record `endowed-with` (endowed with): *praeditus*. |
| 1946 | profugio | added to `escape` (escape) as *profugiō*. |
| 1948 | redimo | new record `ransom` (ransom): *redimō*. |
| 1949 | temeritas | new record `rashness` (rashness): *temeritās*. |
| 1965 | obsequium | new record `compliance` (compliance): *obsequium*. |
| 1967 | praepono | added to `in-charge` (in charge) as *praepōnō*. |
| 1968 | praesentia | skipped: a grammatical variant, the neuter plural of *praesēns* (“present circumstances”), which the list files as a noun of the third declension; the lexicon has *praesēns* and *praesentia, praesentiae*. |
| 1983 | controversia | added to `controversial` (controversial) as *contrōversia*. |
| 1986 | hiberna | new record `winter-quarters` (winter quarters): *hīberna*. |
| 1988 | invictus | new record `invincible` (invincible): *invictus*. |
| 1993 | refugio | added to `escape` (escape) as *refugiō*. |

## Batch 2: from rank 2,001 (15 November 2026)

Scope: the lemmas the coverage script reported as not covered, in rank order from 2,003 to 2,761 (196 lemmas). Outdoor and farm words are now part of this sweep (*pābulum, jūmentum, āridus, fēcundus*).

Result: 185 Latin words entered: 95 new records, and 90 terms added to existing records. Eleven lemmas were not entered (in the table). By the script’s count after this batch, 3 of the first 2,000 are still not covered (*resistō*, *arvum*, the neuter plural *praesentia*) and 975 of the first 5,000. The next missing lemma is *impotēns* (rank 2,765).

Method, as in batch 1, with these differences:

- Every example this round is one of Lewis & Short’s quotations (the loci collections were not searched), with house macrons and j, cited as Lewis & Short gives it and marked so.
- Where Lewis & Short’s reference to Cicero has a chapter number only, it was not used, since it cannot be turned into a section number without the text. Three references that had first been converted by guesswork were taken out again before the commit.
- A word went into an existing record when that record’s headword or one of its “also” words is the English meaning; the placements were read one by one and about twenty were changed to a new record where the existing one meant something else (*plāga* is not “blow” as of the wind, *polluō* is not the “defile” that is a mountain pass).

Things to look at again:

- **arvum** is still not entered: it was left to the outdoor pass in batch 1 and is below this batch’s starting rank. It is the first word for the next batch.
- **resistō** was looked for again. The Perseus XML in the `PerseusDL/lexica` repository (`lat.ls.perseus-eng1.xml`, 77 MB) has no entry with `key="resisto"`: the keys run from *resipisco* straight to *resistentia*, so the article is missing from the Perseus digitisation itself and from everything made from it. Logeion, Latinitium and lsj.gr are closed to this session, and a web search found no other copy. Not entered.
- **Aliases.** `ALIASES` in `scripts/latin_coverage.py` now also maps *saluber* to *salūbris* and *materies* to *māteria*.
- **Nouns and adjectives in verb records, and the reverse.** Several words stand as alternatives in a record of another part of speech, as the lexicon already does (*ultiō* in `get-even`, *rīsus* with the verb for laughing, *jussus* in `order-command`, *flagrō* in `fire`, *purpura* in `purple`). The first recommended term of each record is unchanged.
- **rabiēs** is headed *rabiēs (rabiem, rabiē)*, since Lewis & Short says the other cases do not occur.
- **prīmōrdium** is written with a long *ō* as a compound of *ōrdior*; Lewis & Short leaves the vowel unmarked.
- **tribūnīcius** has a long *ī* (Lewis & Short).

| Rank | Lemma | What was done |
| ---: | --- | --- |
| 2003 | fugo | added to `drive-away` (drive away) as *fugō*. |
| 2004 | horreo | new record `bristle-verb` (bristle): *horreō*. |
| 2012 | lacero | added to `tear` (tear) as *lacerō*. |
| 2021 | aduoco | new record `call-in` (call in): *advocō*. |
| 2024 | pabulum | new record `fodder` (fodder): *pābulum*. |
| 2037 | indo | new record `put-into` (put into): *indō*. |
| 2040 | prodeo | new record `come-out` (come out): *prōdeō*. |
| 2044 | arceo | new record `keep-off` (keep off): *arceō*. |
| 2048 | dispergo | added to `scatter` (scatter) as *dispergō*. |
| 2064 | solutus | added to `loose` (loose) as *solūtus*. |
| 2065 | traduco | new record `lead-across` (lead across): *trādūcō*. |
| 2067 | caelestis | added to `divine` (divine) as *caelestis*. |
| 2069 | dirigo | new record `straighten` (straighten): *dīrigō*. |
| 2072 | extendo | new record `stretch-out` (stretch out): *extendō*. |
| 2073 | fanum | added to `shrine` (shrine) as *fānum*. |
| 2084 | flagro | added to `fire` (fire) as *flagrō*. |
| 2086 | inspicio | added to `examine-closely` (examine closely) as *īnspiciō*. |
| 2089 | philosophus | added to `philosophy` (philosophy) as *philosophus*. |
| 2091 | stringo | new record `draw-tight` (draw tight): *stringō*. |
| 2093 | curuus | new record `curved` (curved): *curvus*. |
| 2100 | nequitia | added to `evil` (evil) as *nēquitia*. |
| 2101 | penetro | new record `penetrate` (penetrate): *penetrō*. |
| 2104 | signo | added to `sign` (sign) as *signō*. |
| 2113 | turpitudo | added to `disgrace` (disgrace) as *turpitūdō*. |
| 2118 | denuntio | added to `announce` (announce) as *dēnūntiō*. |
| 2121 | irrumpo | new record `burst-in` (burst in): *irrumpō*. |
| 2122 | iussus | added to `order-command` (order) as *jussus*. |
| 2125 | rogus | new record `funeral-pyre` (funeral pyre): *rogus*. |
| 2129 | interpono | new record `put-between` (put between): *interpōnō*. |
| 2131 | mentio | added to `mention` (mention) as *mentiō*. |
| 2132 | pando | new record `spread-out` (spread out): *pandō*. |
| 2135 | risus | new record `laughter` (laughter): *rīsus*. |
| 2136 | sceptrum | new record `sceptre` (sceptre): *scēptrum*. |
| 2137 | similitudo | new record `likeness` (likeness): *similitūdō*. |
| 2139 | uasto | added to `plunder` (plunder) as *vāstō*. |
| 2141 | antecedo | new record `go-before` (go before): *antecēdō*. |
| 2143 | carina | not entered: Lewis & Short gives references without quotations, and the loci collections have no line. |
| 2167 | assumo | new record `take-to-oneself` (take to oneself): *assūmō*. |
| 2168 | attendo | added to `attention` (attention) as *attendō*. |
| 2169 | bellua | added to `animal` (animal) as *bēlua*. |
| 2180 | patrimonium | added to `inheritance` (inheritance) as *patrimōnium*. |
| 2184 | saucius | added to `injure` (injure) as *saucius*. |
| 2192 | frumentarius | added to `grain-cereal` (grain) as *frūmentārius*. |
| 2196 | meritus | added to `earn-deserve` (earn) as *meritus*. |
| 2200 | sublimis | new record `lofty` (lofty): *sublīmis*. |
| 2202 | attineo | added to `concern-matter` (concern) as *attineō*. |
| 2205 | ferreus | added to `iron` (iron) as *ferreus*. |
| 2213 | splendor | new record `brightness` (brightness): *splendor*. |
| 2214 | ales | added to `bird` (bird) as *āles*. |
| 2215 | amens | added to `crazy` (crazy) as *āmēns*. |
| 2225 | penes | new record `in-the-hands-of` (in the hands of): *penes*. |
| 2227 | plaga | new record `blow-stroke` (blow): *plāga*. |
| 2230 | resoluo | new record `untie` (untie): *resolvō*. |
| 2232 | uelo | added to `cover` (cover) as *vēlō*. |
| 2233 | uulgo | new record `make-common` (make common): *vulgō*. |
| 2248 | tarde | added to `slowly` (slowly) as *tardē*. |
| 2249 | adigo | new record `drive-to` (drive to): *adigō*. |
| 2255 | impudentia | new record `shamelessness` (shamelessness): *impudentia*. |
| 2257 | libere | new record `freely` (freely): *līberē*. |
| 2259 | occasus | added to `sunset` (sunset) as *occāsus*. |
| 2263 | subdo | new record `put-under` (put under): *subdō*. |
| 2265 | ueneror | new record `revere` (revere): *veneror*. |
| 2271 | flagito | new record `demand` (demand): *flāgitō*. |
| 2275 | infensus | added to `hostile` (hostile) as *īnfēnsus*. |
| 2278 | munimentum | added to `fortify` (fortify) as *mūnīmentum*. |
| 2280 | praecipito | new record `throw-headlong` (throw headlong): *praecipitō*. |
| 2283 | adulatio | added to `flattery` (flattery) as *adūlātiō*. |
| 2290 | coetus | new record `gathering` (gathering): *coetus*. |
| 2292 | daps | added to `banquet` (banquet) as *daps*. |
| 2294 | emineo | new record `stand-out` (stand out): *ēmineō*. |
| 2297 | innumerabilis | added to `countless` (countless) as *innumerābilis*. |
| 2305 | submoueo | added to `drive-away` (drive away) as *summoveō*. |
| 2309 | decurro | new record `run-down` (run down): *dēcurrō*. |
| 2313 | muliebris | new record `womanly` (womanly): *muliebris*. |
| 2314 | simulatio | new record `pretence` (pretence): *simulātiō*. |
| 2315 | ultio | added to `get-even` (get even) as *ultiō*. |
| 2318 | cieo | new record `set-in-motion` (set in motion): *cieō*. |
| 2321 | inermis | added to `armed` (armed) as *inermis*. |
| 2324 | modius | new record `corn-measure` (corn measure): *modius*. |
| 2325 | perfidia | new record `treachery` (treachery): *perfidia*. |
| 2326 | permisceo | added to `mix` (mix) as *permisceō*. |
| 2342 | opportunus | added to `suitable` (suitable) as *opportūnus*. |
| 2345 | tribunatus | added to `tribune` (tribune) as *tribūnātus*. |
| 2346 | trux | new record `grim` (grim): *trux*. |
| 2362 | sortior | new record `draw-lots` (draw lots): *sortior*. |
| 2367 | alternus | new record `alternate` (alternate): *alternus*. |
| 2382 | aridus | added to `dry-adjective` (dry) as *āridus*. |
| 2387 | fictus | new record `feigned` (feigned): *fictus*. |
| 2389 | moderatio | new record `moderation` (moderation): *moderātiō*. |
| 2392 | perimo | added to `destroy` (destroy) as *perimō*. |
| 2393 | perniciosus | new record `harmful` (harmful): *perniciōsus*. |
| 2398 | uigeo | new record `thrive` (thrive): *vigeō*. |
| 2401 | fecundus | added to `productivity` (productivity) as *fēcundus*. |
| 2403 | interitus | added to `destroy` (destroy) as *interitus*. |
| 2404 | largior | new record `give-generously` (give generously): *largior*. |
| 2411 | abrumpo | new record `break-off` (break off): *abrumpō*. |
| 2415 | expers | new record `devoid-of` (devoid of): *expers*. |
| 2417 | fetus | added to `offspring` (offspring) as *fētus*. |
| 2419 | intactus | new record `untouched` (untouched): *intāctus*. |
| 2420 | nescius | added to `ignorant` (ignorant) as *nescius*. |
| 2421 | obsum | added to `hurt` (hurt) as *obsum*. |
| 2422 | paueo | added to `be-afraid` (be afraid) as *paveō*. |
| 2423 | primordium | added to `beginning` (beginning) as *prīmōrdium*. |
| 2429 | approbo | added to `approve` (approve) as *approbō*. |
| 2432 | discutio | new record `shatter` (shatter): *discutiō*. |
| 2441 | necto | added to `tie` (tie) as *nectō*. |
| 2443 | permoueo | new record `move-deeply` (move deeply): *permoveō*. |
| 2446 | tribus | new record `tribe` (tribe): *tribus*. |
| 2452 | capesso | new record `take-in-hand` (take in hand): *capessō*. |
| 2456 | fascis | new record `bundle` (bundle): *fascis*. |
| 2458 | iumentum | new record `beast-of-burden` (beast of burden): *jūmentum*. |
| 2460 | leuitas | new record `lightness` (lightness): *levitās*. |
| 2462 | marmor | new record `marble` (marble): *marmor*. |
| 2466 | purpura | added to `purple` (purple) as *purpura*. |
| 2467 | recuperator | added to `regain` (regain) as *recuperātor*. |
| 2471 | delubrum | added to `shrine` (shrine) as *dēlūbrum*. |
| 2472 | disicio | added to `scatter` (scatter) as *disjiciō*. |
| 2478 | languidus | new record `languid` (languid): *languidus*. |
| 2486 | unum | skipped: a grammatical variant (the neuter of *ūnus*). |
| 2489 | defectio | new record `revolt` (revolt): *dēfectiō*. |
| 2490 | edico | new record `proclaim` (proclaim): *ēdīcō*. |
| 2499 | perinde | added to `as-in-the-way-that` (as) as *perinde*. |
| 2507 | conuoco | new record `call-together` (call together): *convocō*. |
| 2509 | decemuir | not entered: Lewis & Short’s article is *decemvirī*; no quotation with a sure reference was found for an example. |
| 2511 | exquiro | new record `search-out` (search out): *exquīrō*. |
| 2520 | augur | new record `augur` (augur): *augur*. |
| 2535 | saluber | not entered: the lexicon has the word as *salūbris*; the coverage script now counts it (ALIASES). |
| 2537 | tribunicius | added to `tribune` (tribune) as *tribūnicius*. |
| 2544 | formo | added to `form-shape` (form) as *fōrmō*. |
| 2548 | maritimus | new record `maritime` (maritime): *maritimus*. |
| 2556 | rigidus | new record `stiff` (stiff): *rigidus*. |
| 2557 | salutaris | new record `wholesome` (wholesome): *salūtāris*. |
| 2558 | sepelio | added to `bury` (bury) as *sepeliō*. |
| 2561 | suppono | added to `put-under` (put under) as *suppōnō*. |
| 2563 | accio | added to `get-fetch` (get) as *acciō*. |
| 2564 | amplexus | added to `hug` (hug) as *amplexus*. |
| 2567 | decimanus | not entered: no short quotation with a sure reference was found for an example. |
| 2571 | furens | skipped: a grammatical variant (the participle of *furō*, which is in). |
| 2572 | grauidus | added to `pregnant` (pregnant) as *gravidus*. |
| 2576 | sancio | new record `ratify` (ratify): *sanciō*. |
| 2579 | subsisto | new record `halt` (halt): *subsistō*. |
| 2580 | triumpho | added to `triumph` (triumph) as *triumphō*. |
| 2585 | decido | new record `fall-down` (fall down): *dēcidō*. |
| 2594 | inficio | added to `dye` (dye) as *īnficiō*. |
| 2596 | macto | new record `sacrifice` (sacrifice): *mactō*. |
| 2597 | materies | not entered: the lexicon has *māteria*; the coverage script now counts it (ALIASES). |
| 2599 | mitigo | new record `soften` (soften): *mītigō*. |
| 2602 | polluo | new record `defile-pollute` (defile): *polluō*. |
| 2603 | polus | added to `sky` (sky) as *polus*. |
| 2604 | priuatim | added to `private-confidential` (private) as *prīvātim*. |
| 2605 | quocumque | new record `wherever` (wherever): *quōcumque*. |
| 2614 | conquiro | new record `seek-out` (seek out): *conquīrō*. |
| 2616 | defungor | new record `have-done-with` (have done with): *dēfungor*. |
| 2617 | dominatio | not entered: no quotation was found for an example. |
| 2620 | imbuo | added to `soak` (soak) as *imbuō*. |
| 2622 | inultus | new record `unavenged` (unavenged): *inultus*. |
| 2631 | apto | added to `fit` (fit) as *aptō*. |
| 2632 | audaciter | new record `boldly` (boldly): *audācter*. |
| 2633 | benignitas | added to `favour-goodwill` (favour) as *benignitās*. |
| 2638 | indomitus | added to `wild-animal` (wild) as *indomitus*. |
| 2641 | nefandus | new record `unspeakable` (unspeakable): *nefandus*. |
| 2643 | tabernaculum | added to `tent` (tent) as *tabernāculum*. |
| 2647 | biduum | new record `two-days` (two days): *biduum*. |
| 2652 | eloquor | new record `speak-out` (speak out): *ēloquor*. |
| 2653 | funestus | added to `destructive` (destructive) as *fūnestus*. |
| 2654 | generosus | new record `noble` (noble): *generōsus*. |
| 2655 | immemor | new record `forgetful` (forgetful): *immemor*. |
| 2659 | reprimo | added to `control-restrain` (control) as *reprimō*. |
| 2666 | assuesco | added to `get-used-to` (get used to) as *assuēscō*. |
| 2668 | consecro | new record `consecrate` (consecrate): *cōnsecrō*. |
| 2670 | diffundo | added to `pour-out` (pour out) as *diffundō*. |
| 2672 | fastidium | new record `disgust` (disgust): *fastīdium*. |
| 2675 | iniquitas | new record `unfairness` (unfairness): *inīquitās*. |
| 2681 | perfidus | added to `treachery` (treachery) as *perfidus*. |
| 2688 | applico | not entered: the lexicon has it only as a term to avoid in one modern sense; its own record is left for the next batch. |
| 2691 | assideo | new record `sit-by` (sit by): *assideō*. |
| 2698 | imum | skipped: a grammatical variant (the neuter of *īmus*). |
| 2699 | indulgentia | added to `humour-someone` (humour someone) as *indulgentia*. |
| 2701 | miserabilis | new record `pitiable` (pitiable): *miserābilis*. |
| 2704 | profundo | added to `pour-out` (pour out) as *profundō*. |
| 2709 | sagittarius | added to `archery` (archery) as *sagittārius*. |
| 2713 | ultimum | skipped: a grammatical variant (the neuter of *ultimus*). |
| 2719 | dirimo | added to `separate` (separate) as *dirimō*. |
| 2720 | dissipo | added to `scatter` (scatter) as *dissipō*. |
| 2723 | interpres | new record `interpreter` (interpreter): *interpres*. |
| 2726 | munitus | added to `fortify` (fortify) as *mūnītus*. |
| 2727 | necessario | added to `necessary` (necessary) as *necessāriō*. |
| 2729 | obliuio | added to `forget` (forget) as *oblīviō*. |
| 2733 | rabies | added to `madness` (madness) as *rabiēs*. |
| 2737 | triennium | new record `three-years` (three years): *triennium*. |
| 2742 | arripio | added to `grab` (grab) as *arripiō*. |
| 2745 | extorqueo | new record `wrench-away` (wrench away): *extorqueō*. |
| 2749 | oppugnatio | added to `siege` (siege) as *oppugnātiō*. |
| 2752 | tuto | added to `safe` (safe) as *tūtō*. |
| 2753 | addico | new record `adjudge` (adjudge): *addīcō*. |
| 2761 | conuello | added to `tear` (tear) as *convellō*. |

## Batch 3: from rank 2,765, and the words left behind (15 November 2026)

Scope: the lemmas the coverage script reported as not covered, in rank order from 2,765 to 3,261 (183 lemmas), with the words batches 1 and 2 had left and whose reason could be answered (*resistō*, *arvum*, *carīna*, *decemvir*, *decumānus*, *dominātiō*, *applicō*). Two words beyond the range came in with others: *hostia* (3,263) stands with *victima*, and *resideō* (3,573) with *resīdō*. 192 lemmas in all.

Result: 179 Latin words entered: 74 of them in 73 new records, and 105 added as terms to 96 records that already covered their meaning. Two more are now found because an existing term was given its dictionary form (*hilaris*, *citrā*). Eleven lemmas were not entered (in the table). By the script’s count after this batch, one of the first 2,000 is not covered (the neuter plural *praesentia*, a grammatical variant) and 789 of the first 5,000; before the batch it was 3 and 975. The next missing lemma is *fūmō* (rank 3,262).

Method, as in batches 1 and 2, with these differences:

- **Examples from the loci collections again**, where they have a short line with the word (about 70 of the examples): cited plainly, by author and place, in the lexicon’s form (*Plin. Ep. 9.33.4* for the table’s “Ep. IX 33, 4”). No sentence about the collections was added to a record’s `sources`, since such sentences are being taken out of the records. The other examples are Lewis & Short’s quotations, marked so.
- **Lewis & Short’s quotations were compared with the texts** wherever the LASLA corpus has the work (Caesar, Cicero’s speeches, *De officiis*, *De amicitia* and *De senectute*, Sallust, Lucretius, Catullus, Vergil, Horace, Tacitus, Seneca, the younger Pliny’s letters, eight plays of Plautus, Cato’s *De agricultura*; `corpora/lasla`, outside the repository). The dictionary often adapts what it quotes: it puts a phrase in the nominative, drops a word, or prints another reading (*sequentur* for *sequuntur* at Cic. Amic. 74, *aequalitate* for *aequabilitate* at Mur. 41, *tigna* for *ligna* at Cato Agr. 144.3). Where that was so, the evidence gives the dictionary’s bare reference, and the example gives the words of the text, with the section number from the corpus and without the mark “(Lewis & Short)” (about 35 examples). Where the dictionary gave only a chapter of Cicero and the corpus has the speech, the section is the corpus’s (*Cic. Phil. 10.14*, *Cael. 42*, *Verr. 2.2.2*). Quotations from works the corpus lacks (the letters, the philosophical works other than the three named, Livy, Ovid’s *Metamorphoses*, Quintilian, the elder Pliny) could not be compared and keep the dictionary’s wording, as before.
- **Plautus by the line** where the corpus has the play: *Plaut. Amph. 649*, *Bacch. 1154*, *Aul. 600*, for Lewis & Short’s act, scene and line. The other plays, and Terence, keep the dictionary’s numbering with the mark.
- **A word without a quotation in Lewis & Short** was entered if the text at one of the dictionary’s references could be read in the corpus (*carīna*, Caes. BG 3.13.1; *crēditor*, Cic. Phil. 6.11; *ebur*, Verg. G. 1.57; *dominātiō*, Sall. Cat. 5.6). That answers the reason for which batch 2 left *carīna*, *decemvir*, *decumānus* and *dominātiō*.
- Every quotation typed into a record was checked by a script against the place it is said to come from: the Lewis & Short article, the loci table, or the corpus. Nothing is quoted from memory.

Things to look at again:

- **resistō** is entered, in `oppose`, without Lewis & Short, whose article is still missing. Its principal parts (*resistō, -ere, restitī*) are Andresian’s (p. 62); the sense is de Vaan’s (p. 567, s.v. *sistō*: “to pause, offer resistance”, from Plautus on); Lewis & Short names the word as a synonym under *adversor*, *repugnō* and *renītor* and says of *sistō* with a dative that it is the same as *resistere*; the examples were read in Caesar (BG 2.26.2) and in the loci collections (Ov. Rem. 82). Traupman, Morgan–Owens and Levi–Bini have no entry for it. The short *e* follows the ruling on *re-* before *st*. If this is not enough, take the term out of `oppose`.
- **līctor** is written with a long *ī*, with a note: Lewis & Short’s headword has no mark, but its article says “pronounced *līctor*, Gell. 12, 3, 4”. Gellius himself was not read, and de Vaan has no article.
- **mūcrō or mucrō** was not entered: Lewis & Short prints no mark, the loci collections write *mūcrō*, de Vaan has no article, and the *u* stands before *cr*.
- **Spellings where the loci collections and the lexicon differ.** The examples follow the lexicon’s entries, which follow Lewis & Short: *repente* (the loci table at Gell. 9.11.7 has *repentē*), *edepol* (the table at Plaut. Most. 376 has *ēdepol*), *biduum* (the table at Cic. Tusc. 2.40 has *bīduum*). One of the two is a slip in each case. Also seen and not touched, since they are other records: *existimātiō* is entered with a short *i* beside *exīstimō*; `previously` has *triduī* for *trīduī*.
- **Plin. Ep. 2.17.4** (*vīlla ūsibus capāx*): the loci table gives section 3; Lewis & Short and the corpus give 4, which the record follows.
- **Readings of the corpus’s text** that differ from Lewis & Short’s and were followed in an example: *templa* (Lucr. 2.28, for *tecta*), *ligna* (Cato Agr. 144.3, for *tigna*), *omnīs*, *cīvīs*, *hostīs* (accusatives in *-īs*). Line numbers follow the corpus where they differ by one (*Verg. G. 2.294*, *Lucr. 5.1363*).
- **deep** had no record. It now has one, headed by *altus* (which the lexicon had only as “high”) with *profundus* beside it; *altus* is not a word from the list.
- **Two existing terms were given their dictionary form** so that the word is found: `cheerful` had *hilarus / hilaris*, now *hilaris, hilare (hilarus)*; `on-this-side-of` had *citrā + acc.* and *cis + acc.*, now *citrā (+ acc.)* and *cis (+ acc.)*, as the other prepositions are written.
- **Words in a record of another part of speech**, as before: *madeō* in `wet`, *invidiōsus* in `envy`, *mināx* in `threat`, *grātulātiō* in `congratulations`, *interveniō* in `intervention`, *tremulus* in `shiver`, *rubor* in `blush`, *inertia* in `lazy`, *exta* in `guts-intestines`, *servīlis* in `slave`, *legiōnārius* in `legion`, *trānsgredior* in `across`, *igneus* in `fire`, *aetherius* in `sky`, *sēditiōsus* in `mutiny`, *salveō* in `hello`, *molestē* in `annoy`. The first recommended term of each record is unchanged; of the records touched, `scripts/answer_kinds.py` lists three (`available`, `else`, `summons`), which were on its list before.
- **English headwords that may want changing**: “champion” (*vindex*), “bountiful” (*almus*), “offence” (*offēnsiō*), “acquaintance” (*nōtitia*), “fallen” (*cadūcus*), “properly” (*commodē*), “the youth” (*pūbēs*), “duties” (*mūnia*), “set foot on” (*īnsistō*), “public thanksgiving” (*supplicātiō*), “pour a libation” (*lībō*, which also means taste and sip), “break down” (*rescindō*), “break out” (*coorior*), “cut off” (*interclūdō*), “carry away” (*dēportō*).
- **obscēnus** is marked for adults (`audience`), as `dirty-talk` is not; the two should agree.
- **Register labels** (*torvus*, *fēmineus*, *genetrīx*, *almus*, *pharetra*, *immōtus*, *tremulus*) follow Lewis & Short’s “poet.” or “mostly poet.”; *imputō*, *curvō*, *nūtriō*, *concieō*, *citus* and *dehinc* carry its remark on where the word is and is not found.
- **An example was dropped for the spelling script**: Tac. Germ. 45.1 (*trāns Suionas aliud mare, pigrum ac prope immōtum*) is a good line for *immōtus*, but `consonantal_j.py` reads *Suionas* as wanting a *j*, and its list of exceptions was left alone.
- **Aliases.** `ALIASES` in `scripts/latin_coverage.py` now also maps *nihilo* to *nihilum* and *eiusmodi* to *modus* (as *huiusmodi* already was), and *disicio* to the lexicon’s *disjiciō*, which batch 2 had entered and the script still counted as missing. *iugerum*, *requies* and *munia* map to themselves: the corpus files them under another declension than the lexicon’s, so the script took them for other words.
- **Left for the next batch**: *interjiciō* (Lewis & Short’s article is *interjaciō*), *ēlīdō* and *cōnstanter*, whose articles were not read far enough for a quotation.

| Rank | Lemma | What was done |
| ---: | --- | --- |
| 886 | resisto | added to `oppose` (oppose) as *resistō*. Lewis & Short’s article is still missing; the word was entered from the other references (see “Things to look at again”). |
| 1188 | arvum | added to `field` (field) as *arvum*. |
| 2143 | carina | new record `keel` (keel): *carīna*. |
| 2509 | decemvir | new record `decemvir` (decemvir): *decemvir*. |
| 2567 | decimanus | added to `tithe` (tithe) as *decumānus*. |
| 2617 | dominatio | new record `tyranny` (tyranny): *dominātiō*. |
| 2688 | applico | added to `attach` (attach) as *applicō*. |
| 2765 | impotens | new record `powerless` (powerless): *impotēns*. |
| 2767 | jugulo | added to `kill` (kill) as *jugulō*. |
| 2773 | madeo | added to `wet` (wet) as *madeō*. |
| 2775 | mollio | added to `soften` (soften) as *molliō*. |
| 2779 | salveo | added to `hello` (hello) as *salveō*. |
| 2787 | armatura | added to `armour` (armour) as *armātūra*. |
| 2788 | capax | new record `spacious` (spacious): *capāx*. |
| 2789 | circumfundo | added to `surround` (surround) as *circumfundō*. |
| 2790 | complexus | added to `hug` (hug) as *complexus*. |
| 2791 | dispar | added to `different` (different) as *dispār*. |
| 2792 | elabor | added to `slip-away` (slip away) as *ēlābor*. |
| 2794 | fatalis | new record `fated` (fated): *fātālis*. |
| 2795 | invidiosus | added to `envy` (envy) as *invidiōsus*. |
| 2796 | jugerum | new record `acre` (acre): *jūgerum*. |
| 2798 | offensio | new record `offence` (offence): *offēnsiō*. |
| 2799 | praecedo | added to `go-before` (go before) as *praecēdō*. |
| 2807 | vindex | new record `champion-defender` (champion): *vindex*. |
| 2808 | adjutor | new record `helper` (helper): *adjūtor*. |
| 2813 | desertus | new record `deserted` (deserted): *dēsertus*. |
| 2814 | digredior | added to `go-away` (go) as *dīgredior*. |
| 2815 | excio | added to `get-fetch` (get) as *exciō*. |
| 2818 | fugitivus | new record `runaway` (runaway): *fugitīvus*. |
| 2823 | intercludo | new record `cut-off` (cut off): *interclūdō*. |
| 2824 | intervenio | added to `intervention` (intervention) as *interveniō*. |
| 2827 | praesto | added to `available` (available) as *praestō*. |
| 2832 | servilis | added to `slave` (slave) as *servīlis*. |
| 2835 | victrix | added to `winner` (winner) as *victrīx*. |
| 2836 | ultor | new record `avenger` (avenger): *ultor*. |
| 2838 | bello | new record `wage-war` (wage war): *bellō*. |
| 2841 | deporto | new record `carry-away` (carry away): *dēportō*. |
| 2849 | plausus | new record `applause` (applause): *plausus*. |
| 2850 | proditor | new record `traitor` (traitor): *prōditor*. |
| 2851 | turpiter | added to `disgraceful` (disgraceful) as *turpiter*. |
| 2852 | victima | new record `sacrificial-victim` (sacrificial victim): *victima*. |
| 2855 | aetherius | added to `sky` (sky) as *aetherius*. |
| 2860 | celsus | added to `high` (high) as *celsus*. |
| 2864 | displiceo | new record `displease` (displease): *displiceō*. |
| 2868 | furiosus | added to `crazy` (crazy) as *furiōsus*. |
| 2871 | invoco | new record `invoke` (invoke): *invocō*. |
| 2872 | legionarius | added to `legion` (legion) as *legiōnārius*. |
| 2873 | lenio | added to `soften` (soften) as *lēniō*. |
| 2874 | luo | new record `atone` (atone): *luō*. |
| 2882 | auratus | added to `golden` (golden) as *aurātus*. |
| 2887 | defigo | added to `fix-fasten` (fix) as *dēfīgō*. |
| 2890 | labo | added to `wobble` (wobble) as *labō*. |
| 2892 | laudatio | added to `praise` (praise) as *laudātiō*. |
| 2893 | libo | new record `pour-a-libation` (pour a libation): *lībō*. |
| 2894 | lictor | new record `lictor` (lictor): *līctor*. |
| 2895 | miseror | added to `pity` (pity) as *miseror*. |
| 2900 | saepio | new record `fence-in` (fence in): *saepiō*. |
| 2908 | conscendo | added to `get-on` (get on) as *cōnscendō*. |
| 2910 | creditor | new record `creditor` (creditor): *crēditor*. |
| 2912 | ebur | new record `ivory` (ivory): *ebur*. |
| 2913 | editus | added to `high` (high) as *ēditus*. |
| 2916 | fraternus | new record `brotherly` (brotherly): *frāternus*. |
| 2919 | minax | added to `threat` (threat) as *mināx*. |
| 2927 | profundus | new record `deep` (deep): *profundus*. |
| 2933 | abundo | added to `abundant` (abundant) as *abundō*. |
| 2934 | adveho | added to `bring` (bring) as *advehō*. |
| 2936 | anteeo | added to `go-before` (go before) as *anteeō*. |
| 2940 | confligo | added to `fight` (fight) as *cōnflīgō*. |
| 2943 | discors | added to `conflict-dispute` (conflict) as *discors*. |
| 2944 | eruptio | new record `eruption` (eruption): *ēruptiō*. |
| 2950 | habena | new record `rein` (rein): *habēna*. |
| 2951 | imputo | added to `accept-blame` (accept blame) as *imputō*. |
| 2952 | inertia | added to `lazy` (lazy) as *inertia*. |
| 2953 | inhibeo | added to `control-restrain` (control) as *inhibeō*. |
| 2954 | insisto | new record `set-foot-on` (set foot on): *īnsistō*. |
| 2960 | moleste | added to `annoy` (annoy) as *molestē*. |
| 2962 | occulte | added to `secretly` (secretly) as *occultē*. |
| 2963 | persolvo | added to `pay` (pay) as *persolvō*. |
| 2966 | prosterno | added to `knock-down` (knock down) as *prōsternō*. |
| 2967 | requiesco | added to `rest` (rest) as *requiēscō*. |
| 2970 | tremulus | added to `shiver` (shiver) as *tremulus*. |
| 2979 | cunctatio | added to `hesitate` (hesitate) as *cūnctātiō*. |
| 2988 | nihilo | not entered: the ablative of *nihilum* (which is in), filed by the corpus as an adverb (*nihilō minus*, *nihilō sētius*); Lewis & Short sends it to *nihil*. The coverage script now counts it under *nihilum* (ALIASES). |
| 2990 | obliquus | new record `slanting` (slanting): *oblīquus*. |
| 3000 | rescindo | new record `break-down` (break down): *rescindō*. |
| 3001 | sacramentum | added to `swear-oath` (swear) as *sacrāmentum*. |
| 3006 | talentum | new record `talent-weight` (talent): *talentum*. |
| 3007 | torvus | added to `grim` (grim) as *torvus*. |
| 3008 | transgredior | added to `across` (across) as *trānsgredior*. |
| 3012 | alio | added to `else` (else) as *aliō*. |
| 3015 | assuetus | added to `get-used-to` (get used to) as *assuētus*. |
| 3018 | damnatio | new record `condemnation` (condemnation): *damnātiō*. |
| 3020 | ejusmodi | not entered: the lexicon has it as *ejus modī (hujus modī)*, written as two words, in `such`. The coverage script now counts it (ALIASES), as it already counts *hujusmodī*. |
| 3023 | exterreo | added to `frighten` (frighten) as *exterreō*. |
| 3025 | haruspex | new record `soothsayer` (soothsayer): *haruspex*. |
| 3030 | naris | added to `nostrils` (nostrils) as *nāris*. |
| 3034 | posteaquam | added to `after-conjunction` (after) as *posteāquam*. |
| 3035 | posteritas | new record `posterity` (posterity): *posteritās*. |
| 3037 | rite | new record `duly` (duly): *rīte*. |
| 3039 | supplicatio | new record `public-thanksgiving` (public thanksgiving): *supplicātiō*. |
| 3044 | assisto | new record `stand-by` (stand by): *assistō*. |
| 3045 | aversus | added to `turn-away` (turn away) as *āversus*. |
| 3047 | citus | added to `fast-quick` (fast) as *citus*. |
| 3048 | conclamo | added to `shout` (shout) as *conclāmō*. |
| 3049 | domicilium | new record `dwelling` (dwelling): *domicilium*. |
| 3050 | femineus | added to `womanly` (womanly) as *fēmineus*. |
| 3053 | illo | added to `there-direction` (there) as *illō*. |
| 3056 | injustus | added to `unfair` (unfair) as *injūstus*. |
| 3059 | notitia | new record `acquaintance` (acquaintance): *nōtitia*. |
| 3060 | obscenus | new record `obscene` (obscene): *obscēnus*. |
| 3063 | pirata | new record `pirate` (pirate): *pīrāta*. |
| 3065 | procurro | new record `run-forward` (run forward): *prōcurrō*. |
| 3066 | requies | added to `rest` (rest) as *requiēs*. |
| 3067 | revello | added to `tear` (tear) as *revellō*. |
| 3071 | sempiternus | added to `eternal` (eternal) as *sempiternus*. |
| 3075 | temperantia | added to `self-control` (self-control) as *temperantia*. |
| 3077 | valens | added to `powerful` (powerful) as *valēns*. |
| 3079 | clamito | added to `shout` (shout) as *clāmitō*. |
| 3080 | concieo | added to `excite` (excite) as *concieō*. |
| 3081 | consulto | added to `consider` (consider) as *cōnsultō*. |
| 3084 | exta | added to `guts-intestines` (guts) as *exta*. |
| 3086 | hilaris | the term of `cheerful` (cheerful) that read *hilarus / hilaris* now has the dictionary form *hilaris (hilarus), hilare*, so that the word is found; a citation and an example were added. |
| 3089 | immotus | new record `motionless` (motionless): *immōtus*. |
| 3090 | incultus | new record `uncultivated` (uncultivated): *incultus*. |
| 3092 | infringo | added to `snap-break` (snap) as *īnfringō*. |
| 3098 | praecido | added to `cut` (cut) as *praecīdō*. |
| 3101 | sacro | added to `consecrate` (consecrate) as *sacrō*. |
| 3102 | satietas | new record `satiety` (satiety): *satietās*. |
| 3104 | volucer | added to `winged` (winged) as *volucer*. |
| 3105 | advento | added to `approach` (approach) as *adventō*. |
| 3107 | genetrix | added to `mother` (mother) as *genetrīx*. |
| 3111 | mucro | not entered: the length of the *u* is in doubt. Lewis & Short prints *mucro* without a mark, the loci collections write *mūcrō*, and de Vaan has no article; the word stands before *cr*, so verse does not decide. Left for the editor. |
| 3112 | nutrio | added to `feed` (feed) as *nūtriō*. |
| 3113 | obduco | added to `cover` (cover) as *obdūcō*. |
| 3114 | oraculum | new record `oracle` (oracle): *ōrāculum*. |
| 3116 | percurro | new record `run-through` (run through): *percurrō*. |
| 3117 | perrumpo | new record `break-through` (break through): *perrumpō*. |
| 3118 | perspicuus | added to `clear-distinct` (clear) as *perspicuus*. |
| 3119 | pompa | new record `procession` (procession): *pompa*. |
| 3127 | almus | new record `bountiful` (bountiful): *almus*. |
| 3129 | cito | added to `summons` (summons) as *citō*. |
| 3131 | commode | new record `properly` (properly): *commodē*. |
| 3134 | coorior | new record `break-out` (break out): *coorior*. |
| 3136 | devincio | added to `bind-oblige` (bind) as *dēvinciō*. |
| 3143 | juratus | added to `swear-oath` (swear) as *jūrātus*. |
| 3145 | limes | new record `boundary` (boundary): *līmes*. |
| 3146 | naufragium | new record `shipwreck` (shipwreck): *naufragium*. |
| 3149 | ordior | added to `begin` (begin) as *ōrdior*. |
| 3152 | sublevo | added to `lift-raise` (lift) as *sublevō*. |
| 3154 | absumo | new record `consume` (consume): *absūmō*. |
| 3156 | animans | added to `animal` (animal) as *animāns*. |
| 3157 | avello | added to `tear` (tear) as *āvellō*. |
| 3160 | devinco | added to `defeat` (defeat) as *dēvincō*. |
| 3161 | exanimo | added to `out-of-breath` (out of breath) as *exanimō*. |
| 3165 | gratulatio | added to `congratulations` (congratulations!) as *grātulātiō*. |
| 3166 | incautus | added to `careless` (careless) as *incautus*. |
| 3167 | incertum | skipped: a grammatical variant, the neuter of *incertus* used as a noun (Lewis & Short has it under *incertus*, which is in). |
| 3170 | interimo | added to `kill` (kill) as *interimō*. |
| 3177 | pharetra | new record `quiver` (quiver): *pharetra*. |
| 3183 | triduum | new record `three-days` (three days): *trīduum*. |
| 3184 | vadimonium | new record `bail` (bail): *vadimōnium*. |
| 3185 | vibro | new record `brandish` (brandish): *vibrō*. |
| 3190 | axis | new record `axle` (axle): *axis*. |
| 3192 | caducus | new record `fallen` (fallen): *cadūcus*. |
| 3197 | dehinc | added to `then-next` (then) as *dehinc*. |
| 3200 | emergo | new record `emerge` (emerge): *ēmergō*. |
| 3203 | exsurgo | added to `get-up` (get up) as *exsurgō*. |
| 3206 | inceptum | skipped: a grammatical variant, the neuter participle of *incipiō* (which is in) used as a noun; Lewis & Short has it at the end of that article. |
| 3209 | interjicio | left for the next batch: Lewis & Short’s article is under *interjaciō*, which was not read. |
| 3213 | munia | new record `duties` (duties): *mūnia*. |
| 3214 | resido | added to `sit` (sit) as *resīdō*. |
| 3215 | rubor | added to `blush` (blush) as *rubor*. |
| 3224 | citra | the term of `on-this-side-of` (on this side of) that read *citrā + acc.* is now written *citrā (+ acc.)*, as the other prepositions are, so that the word is found (and *cis + acc.* likewise *cis (+ acc.)*). |
| 3227 | debilito | new record `weaken` (weaken): *dēbilitō*. |
| 3231 | elido | left for the next batch: no quotation with a sure reference was read. |
| 3236 | fragilis | new record `fragile` (fragile): *fragilis*. |
| 3237 | horrendus | skipped: a grammatical variant, the gerundive of *horreō* (which is in); Lewis & Short has no such headword. |
| 3238 | igneus | added to `fire` (fire) as *igneus*. |
| 3239 | immunis | new record `exempt` (exempt): *immūnis*. |
| 3242 | laeva | skipped: a grammatical variant, the feminine of *laevus* used as a noun (“the left hand”); the lexicon has *laevus* and *ā laevā*. |
| 3247 | pubes | new record `the-youth` (the youth): *pūbēs*. |
| 3249 | revolvo | added to `roll` (roll) as *revolvō*. |
| 3250 | sapienter | added to `wise` (wise) as *sapienter*. |
| 3251 | sector | added to `chase` (chase) as *sector*. |
| 3252 | seditiosus | added to `mutiny` (mutiny) as *sēditiōsus*. |
| 3254 | superstitio | new record `superstition` (superstition): *superstitiō*. |
| 3257 | volens | skipped: a grammatical variant, the participle of *volō* (which is in). |
| 3259 | constanter | left for the next batch: the adverb’s section at the end of Lewis & Short’s *cōnstō* was not read in full. |
| 3260 | curvo | added to `bend-verb` (bend) as *curvō*. |
| 3261 | discurro | new record `run-about` (run about): *discurrō*. |
| 3263 | hostia | new record `sacrificial-victim` (sacrificial victim): *hostia*. |
| 3573 | resideo | added to `sit` (sit) as *resideō*. |
