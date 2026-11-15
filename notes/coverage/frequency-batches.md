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
