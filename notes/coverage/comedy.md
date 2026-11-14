# The comedy sweep: Plautus and Terence

Made on 15 November 2026. The sweep of the authors (README, "To do") was to take the classical authors one by one, those first whose vocabulary is closest to everyday life now. Caesar, Livy and Tacitus are full of the army and of Roman politics; Plautus and Terence give the words of the household, of family and neighbours, of money and errands, of quarrels and affection, and the small words of talk. This file lists what the sweep entered, what it looked at and left, and what remains.

## Sources and method

- **Plautus.** The corpus (LASLA; see `refs/README.md`) has eight plays, lemmatised by hand: Amphitruo, Asinaria, Aulularia, Bacchides, Captivi, Casina, Curculio, Epidicus. Their counts were added together with the classes of `scripts/latin_frequency.py` (`Corpus`, `lines`, `covered_rows`) and every lemma no term is headed by was listed, most frequent first. Before the sweep the eight plays had 4,713 lemmas, of which the lexicon lacked 2,025; after it, 1,894. So 131 of the plays' lemmas were closed; the other Latin entered here is phrases, words that were in the lexicon only inside a longer term, and the prose words that stand beside the comic ones (*faenerātor* beside *danīsta*).
- **Terence** is not in the corpus. The two quotation tables of the Latinitas repository (`loci-terentius.md`, `loci-plautus.md`) were checked row by row against the lexicon: nearly all their phrases were already in. The Perseus text of the six plays (PerseusDL `canonical-latinLit`, phi0134, kept outside this repository) was matched form by form against the stems the builder computes for the search (`search_stems`, `ENDINGS`), which gave a list of candidates to read by eye, not a measurement; it confirmed the Plautine list (*rescīscō, quāpropter, sīquidem, tantisper, opperior, stultitia, malitia*).
- **Every word** was looked up in Lewis & Short (`scripts/lookup.py ls`) for its sense, its quantities and the authors who use it; the register labels (*vōx cōmica: Plaut., Ter.*) rest on what Lewis & Short says of the word.
- **Every quotation cited by the line of a play** was taken from the Perseus text (Plautus ed. Leo, whose line numbers are the usual ones; Terence ed. Parry) or from the loci tables, and then checked by a script against the Perseus text of the cited lines: 346 quotations, all of which match once macrons and j are set aside (the one difference is our *ējicī* for the edition's *eici*). Parry's Terence runs one line ahead of the OCT in *Adelphoe* 618–997 and one behind in *Eunuchus* from about 390 to 1094 (so the loci table says); lines from those stretches are cited by the OCT's number, and where only Lewis & Short's act, scene and line was to hand it is given with "(Lewis & Short)". Citations of prose authors are Lewis & Short's, and say so.
- Archaic spellings of the editions are kept in quotations (*quom, aequomst, optumast, lubēns, convorram*); clipped *-ne* has its apostrophe (*Potin' ut, Pergin', Nūptan'*).

## What was entered

179 Latin words and phrases: 93 in 63 new records, 86 added to 73 records that had the English already.

### New records

| English | Latin | Record | First citation |
| --- | --- | --- | --- |
| dowry | *dōs, dōtis f.* | `dowry` | Plaut. Aul. 238b |
| widow | *vidua, viduae f.* | `widow` | Plaut. Mil. 964–965 |
| widow | *viduus, vidua, viduum* | `widow` | Plaut. Merc. 4.6.13 |
| adulterer | *adulter, adulterī m.* | `adulterer` | Plaut. Amph. 1049 |
| adulterer | *moechus, moechī m.* | `adulterer` | Plaut. Mil. 775 |
| rival (in love) | *rīvālis, rīvālis m.* | `rival-in-love` | Plaut. Stich. 434 |
| mistress (of a household) | *era, erae f.* | `mistress-of-the-house` | Plaut. Cist. 674 |
| mistress (of a household) | *domina, dominae f.* | `mistress-of-the-house` | Ter. Heaut. 2.3.57 (Lewis & Short) |
| heir | *hērēs, hērēdis m./f.* | `heir` | Plaut. Men. 62 |
| inheritance | *hērēditās, hērēditātis f.* | `inheritance` | Plaut. Curc. 127 |
| will (the document) | *testāmentum, testāmentī n.* | `will-testament` | Plaut. Asin. 306b |
| doorkeeper | *jānitor, jānitōris m.* | `doorkeeper` | Plaut. Men. 673 |
| doorkeeper | *ōstiārius, ōstiāriī m.* | `doorkeeper` | Varr. RR 1.13 (Lewis & Short) |
| moneylender | *faenerātor (fēnerātor), faenerātōris m.* | `moneylender` | Cic. Off. 1.150 |
| moneylender | *danīsta, danīstae m.* | `moneylender` | Plaut. Epid. 55 |
| quarrel | *lītigō, lītigāre, lītigāvī, lītigātum* | `quarrel` | Plaut. Cas. 317 |
| quarrel | *jūrgō, jūrgāre, jūrgāvī, jūrgātum* | `quarrel` | Ter. And. 2.3.15 |
| quarrel | *rixor, rixārī, rixātus sum* | `quarrel` | Cic. de Or. 2.240 |
| grieve | *maereō, maerēre* | `grieve` | Plaut. Aul. 727 |
| grieve | *lūgeō, lūgēre, lūxī, lūctum* | `grieve` | Cic. Mil. 20 |
| consolation | *sōlācium, sōlāciī n.* | `consolation` | Plaut. Amph. 643 |
| consolation | *cōnsōlātiō, cōnsōlātiōnis f.* | `consolation` | Cic. Tusc. 3.77 |
| be mad (out of one’s mind) | *īnsāniō, īnsānīre, īnsānīvī (īnsāniī), īnsānītum* | `be-mad` | Plaut. Amph. 753 |
| madness | *īnsānia, īnsāniae f.* | `madness` | Plaut. Amph. 798 |
| madness | *āmentia, āmentiae f.* | `madness` | Cic. Tusc. 3.10 |
| madness | *dēmentia, dēmentiae f.* | `madness` | Cic. Tusc. 3.10 (Lewis & Short) |
| talkative | *loquāx, loquācis* | `talkative` | Plaut. Aul. 124 |
| talkative | *garrulus, garrula, garrulum* | `talkative` | Plaut. Curc. 477 |
| foolishness | *stultitia, stultitiae f.* | `foolishness` | Plaut. Aul. 752 |
| malice | *malitia, malitiae f.* | `malice` | Plaut. Aul. 215 |
| provoke | *irrītō (inrītō), irrītāre, irrītāvī, irrītātum* | `provoke` | Plaut. Amph. 707b |
| talk round | *exōrō, exōrāre, exōrāvī, exōrātum* | `talk-round` | Plaut. Asin. 707b |
| reproach (throw in someone’s teeth) | *exprobrō, exprobrāre, exprobrāvī, exprobrātum* | `reproach-with` | Plaut. Most. 300b |
| win over (with charm or soft words) | *dēlēniō (dēlīniō), dēlēnīre, dēlēnīvī, dēlēnītum* | `win-over` | Plaut. Cist. 517 |
| win over (with charm or soft words) | *plācō, plācāre, plācāvī, plācātum* | `win-over` | Ter. Ph. 5.3.1 |
| it irks me | *piget, pigēre, piguit (pigitum est)* | `it-irks-me` | Plaut. Ps. 281 |
| lame | *claudus, clauda, claudum* | `lame` | Plaut. Aul. 73 |
| toothless | *ēdentulus, ēdentula, ēdentulum* | `toothless` | Plaut. Most. 275 |
| bearded | *barbātus, barbāta, barbātum* | `bearded` | Cic. N. D. 1.83 |
| one-eyed | *luscus, lusca, luscum* | `one-eyed` | Plaut. Trin. 465 |
| clear your throat | *screō, screāre* | `clear-your-throat` | Plaut. Curc. 117 |
| clear your throat | *exscreō, exscreāre* | `clear-your-throat` | Cels. 4.6 |
| recline at table | *accumbō, accumbere, accubuī, accubitum* | `recline-at-table` | Plaut. Most. 308 |
| recline at table | *accubō, accubāre* | `recline-at-table` | Plaut. Bacch. 81b |
| recline at table | *discumbō, discumbere, discubuī, discubitum* | `recline-at-table` | Cic. Att. 5.1.4 |
| honey wine | *mulsum, mulsī n.* | `honey-wine` | Plaut. Asin. 906 |
| famished | *famēlicus, famēlica, famēlicum* | `famished` | Plaut. Cas. 130 |
| fasting (having eaten nothing) | *jējūnus, jējūna, jējūnum* | `fasting-hungry` | Cic. Fam. 7.26.1 |
| salty | *salsus, salsa, salsum* | `salty` | Ter. Ad. 425 |
| bone (take the bones out) | *exossō, exossāre, exossāvī, exossātum* | `bone-a-fish` | Ter. Ad. 378 |
| gut (take the insides out) | *exenterō (exinterō), exenterāre, exenterāvī, exenterātum* | `gut-a-fish` | Petr. 54.3 |
| travel money | *viāticum, viāticī n.* | `travel-money` | Plaut. Capt. 449 |
| thrifty | *parcus, parca, parcum* | `thrifty` | Plaut. Aul. 335 |
| spendthrift | *prōdigus, prōdiga, prōdigum* | `spendthrift` | Plaut. Amph. 1031 |
| spendthrift | *damnōsus, damnōsa, damnōsum* | `spendthrift` | Plaut. Curc. 472 |
| lantern | *lanterna (lāterna), lanternae f.* | `lantern` | Plaut. Amph. 406 |
| nod | *annuō (adnuō), annuere, annuī, annūtum* | `nod` | Plaut. Asin. 784 |
| nod | *nūtō, nūtāre, nūtāvī, nūtātum* | `nod` | Plaut. Mil. 207 |
| nod | *abnuō, abnuere, abnuī* | `nod` | Plaut. Capt. 481 |
| disaster | *calamitās, calamitātis f.* | `disaster` | Plaut. Capt. 911 |
| not know | *ignōrō, ignōrāre, ignōrāvī, ignōrātum* | `not-know` | Plaut. Amph. 37 |
| not know | *nesciō, nescīre, nescīvī (nesciī), nescītum* | `not-know` | Cic. Tusc. 1.60 |
| witty | *facētus, facēta, facētum* | `witty` | Plaut. Mil. 642 |
| witty | *salsus, salsa, salsum* | `witty` | Cic. de Or. 2.228 |
| throw out (of the house) | *ējiciō, ējicere, ējēcī, ējectum* | `throw-out` | Plaut. Asin. 632 |
| throw out (of the house) | *extrūdō, extrūdere, extrūsī, extrūsum* | `throw-out` | Plaut. Aul. 44 |
| hide (a thing, or a fact) | *cēlō, cēlāre, cēlāvī, cēlātum* | `hide-conceal` | Plaut. Bacch. 375–376 |
| hide (a thing, or a fact) | *occultō, occultāre, occultāvī, occultātum* | `hide-conceal` | Plaut. Aul. 277 |
| hide (a thing, or a fact) | *abstrūdō, abstrūdere, abstrūsī, abstrūsum* | `hide-conceal` | Plaut. Aul. 583 |
| hide (a thing, or a fact) | *abdō, abdere, abdidī, abditum* | `hide-conceal` | Cic. Off. 1.126 |
| lock (a door) | *occlūdō, occlūdere, occlūsī, occlūsum* | `lock-verb` | Plaut. Aul. 89 |
| four years old | *quadrīmus, quadrīma, quadrīmum* | `four-years-old` | Plaut. Capt. 8 |
| in vain | *frūstrā* | `in-vain` | Plaut. Aul. 178 |
| in vain | *nēquīquam* | `in-vain` | Plaut. Asin. 698 |
| deservedly | *meritō* | `deservedly` | Plaut. Most. 713 |
| so what? | *Quid tum?* | `so-what` | Plaut. Curc. 726 |
| so what? | *Quid tum posteā?* | `so-what` | Plaut. Asin. 346b |
| I’m talking to you | *Tibi dīcō.* | `im-talking-to-you` | Plaut. Men. 378 |
| I’m talking to you | *Tibi ego dīcō.* | `im-talking-to-you` | Plaut. Curc. 516d |
| is that how you treat me? | *Sīcine agis?* | `is-that-how-you-treat-me` | Ter. Ad. 128 |
| is that how you treat me? | *Sīcine …?* | `is-that-how-you-treat-me` | Plaut. Merc. 158 |
| so help me God | *Ita mē dī ament* | `so-help-me` | Plaut. Amph. 597 |
| so help me God | *Ita mē dī amābunt* | `so-help-me` | Plaut. Aul. 496 |
| oh, all right | *Quid istīc?* | `oh-all-right` | Plaut. Trin. 573 |
| can’t you …? (an impatient request) | *Potin' ut …?* | `cant-you` | Plaut. Amph. 903b |
| man is a wolf to man | *Lupus est homō hominī.* | `man-is-a-wolf-to-man` | Plaut. Asin. 495 |
| ill-gotten gains never prosper | *Male partum male disperit.* | `ill-gotten-gains` | Plaut. Poen. 844 |
| better the devil you know | *Nōta mala rēs optima est.* | `better-the-devil-you-know` | Plaut. Trin. 63 |
| lovers’ quarrels are the renewal of love | *Amantium īrae amōris integrātiō est.* | `lovers-quarrels` | Ter. And. 555 |
| you can’t have it both ways | *Simul flāre sorbēreque haud factū facile est.* | `you-cant-have-it-both-ways` | Plaut. Most. 791 |
| flattery wins friends, truth breeds hatred | *Obsequium amīcōs, vēritās odium parit.* | `truth-breeds-hatred` | Ter. And. 68 |
| stir up a hornets’ nest | *crābrōnēs irrītāre* | `stir-up-a-hornets-nest` | Plaut. Amph. 707b |
| old age is itself a disease | *Senectūs ipsa est morbus.* | `old-age-is-a-disease` | Ter. Ph. 575 |

### Terms added to existing records

| English | Latin | Record | First citation |
| --- | --- | --- | --- |
| by Hercules! (the oaths) | *pol* | `by-hercules` | Ter. Ph. 1053 |
| by Hercules! (the oaths) | *mēcastor* | `by-hercules` | Plaut. Cas. 171 |
| come on! (urging) | *Eja! (Heja!)* | `come-on` | Plaut. Aul. 153 |
| bravo | *Eugepae!* | `bravo` | Plaut. Ps. 743 |
| oh no! | *Attatae!* | `oh-no` | Plaut. Asin. 588b |
| therefore | *proinde (proin)* | `therefore` | Plaut. Amph. 311 |
| also | *itidem* | `also` | Plaut. Bacch. 410 |
| since (because, seeing that) | *sīquidem* | `since-because` | Plaut. Aul. 688 |
| carefully (with care and attention) | *sēdulō* | `carefully` | Plaut. Bacch. 871b |
| quickly | *properē* | `quickly` | Plaut. Aul. 264 |
| secretly | *clanculum* | `secretly` | Plaut. Amph. 523 |
| again | *dēnuō* | `again` | Plaut. Amph. 394b |
| for a while | *parumper* | `for-a-while` | Plaut. Bacch. 794 |
| meanwhile | *tantisper* | `meanwhile` | Plaut. Aul. 666 |
| why | *quāpropter* | `why` | Plaut. Asin. 630b |
| however (but, nevertheless) | *atquī* | `however` | Ter. Heaut. 738 |
| with pleasure | *libēns (lubēns), libentis* | `with-pleasure` | Plaut. Asin. 615b |
| otherwise (or else, if not) | *secus* | `otherwise` | Plaut. Aul. 436 |
| a little | *pauxillum, pauxillī n.* | `a-little` | Plaut. Bacch. 833 |
| make fun of | *dērīdeō, dērīdēre, dērīsī, dērīsum* | `make-fun-of` | Plaut. Aul. 223 |
| trick (deceive) | *dēlūdō, dēlūdere, dēlūsī, dēlūsum* | `trick-deceive` | Plaut. Amph. 295 |
| cry (weep) | *lacrimō, lacrimāre, lacrimāvī, lacrimātum* | `cry-weep` | Ter. Hec. 355 |
| tired | *lassus, lassa, lassum* | `tired` | Plaut. Amph. 329 |
| disgrace | *flāgitium, flāgitiī n.* | `disgrace` | Plaut. Asin. 853 |
| disgrace | *probrum, probrī n.* | `disgrace` | Plaut. Amph. 477 |
| chatter | *blaterō, blaterāre, blaterāvī, blaterātum* | `chatter` | Hor. S. 2.7.35 |
| mutter | *muttiō (mūtiō), muttīre, muttīvī* | `mutter` | Plaut. Amph. 381 |
| mutter | *mussitō, mussitāre* | `mutter` | Plaut. Mil. 477 |
| blame | *vituperō, vituperāre, vituperāvī, vituperātum* | `blame` | Plaut. Aul. 326 |
| humour someone | *obsequor, obsequī, obsecūtus sum (+ dat.)* | `humour-someone` | Plaut. Amph. 995 |
| helpful (of a person: obliging, ready to help) | *mōrigerus, mōrigera, mōrigerum (+ dat.)* | `helpful` | Plaut. Amph. 1004 |
| appeal (an earnest call for help or support) | *supplicō, supplicāre, supplicāvī, supplicātum (+ dat.)* | `appeal-plea` | Plaut. Asin. 246 |
| flatter | *palpor, palpārī, palpātus sum (palpō, palpāre) (+ dat.)* | `flatter` | Plaut. Amph. 507 |
| hug | *amplexor, amplexārī, amplexātus sum* | `hug` | Plaut. Asin. 619 |
| kiss | *suāvium (sāvium), suāviī n.* | `kiss` | Plaut. Asin. 940b |
| kiss | *deōsculor, deōsculārī, deōsculātus sum* | `kiss` | Plaut. Cas. 136 |
| help | *opitulor, opitulārī, opitulātus sum (+ dat.)* | `help` | Plaut. Cas. 263 |
| help | *subveniō, subvenīre, subvēnī, subventum (+ dat.)* | `help` | Plaut. Aul. 394 |
| wait for | *opperior, opperīrī, oppertus (opperītus) sum* | `wait-for` | Plaut. Asin. 827b |
| learn (find out) | *rescīscō, rescīscere, rescīvī (resciī), rescītum* | `learn-find-out` | Plaut. Asin. 743 |
| invent | *comminīscor, comminīscī, commentus sum* | `invent` | Plaut. Asin. 102 |
| begin | *occipiō, occipere, occēpī, occeptum* | `begin` | Plaut. Amph. 277 |
| notice (see, become aware of) | *cōnspicor, cōnspicārī, cōnspicātus sum* | `notice` | Plaut. Aul. 388 |
| stupid | *bardus, barda, bardum* | `stupid` | Plaut. Bacch. 1088 |
| stupid | *blennus, blennī m.* | `stupid` | Plaut. Bacch. 1088 |
| perjury | *perjūrus, perjūra, perjūrum* | `perjury` | Plaut. Mil. 1066 |
| fraud | *sȳcophanta, sȳcophantae m.* | `fraud` | Plaut. Men. 283 |
| rob | *compīlō, compīlāre, compīlāvī, compīlātum* | `rob` | Plaut. Aul. 389 |
| rob | *expīlō, expīlāre, expīlāvī, expīlātum* | `rob` | Plaut. Asin. 826 |
| rope | *restis, restis f.* | `rope` | Plaut. Pers. 815 |
| lick | *lingō, lingere, līnxī, līnctum* | `lick` | Plaut. Cas. 458 |
| lick | *ligurriō (ligūriō), ligurrīre, ligurrīvī, ligurrītum* | `lick` | Ter. Eun. 5.4.14 (Lewis & Short) |
| sip | *sorbeō, sorbēre, sorbuī* | `sip` | Plaut. Mil. 818c |
| punch (a blow with the fist) | *colaphus, colaphī m.* | `punch-blow` | Plaut. Pers. 846b |
| bile | *fel, fellis n.* | `bile` | Plaut. Cas. 223 |
| sweep | *converrō (convorrō), converrere, converrī, conversum* | `sweep` | Plaut. Stich. 375 |
| knock (at the door) | *pultō, pultāre* | `knock` | Plaut. Bacch. 581 |
| potty | *matula, matulae f.* | `potty` | Plaut. Most. 386 |
| calm (quiet, still, placid) | *tranquillus, tranquilla, tranquillum* | `calm-person` | Plaut. Amph. 958 |
| clever | *scītus, scīta, scītum* | `clever` | Plaut. Cas. 522b |
| cunning | *versūtus (vorsūtus), versūta, versūtum* | `cunning` | Plaut. Epid. 371 |
| compassionate | *misericors, misericordis* | `compassionate` | Plaut. Rud. 585 |
| greedy | *avidus, avida, avidum* | `greedy` | Plaut. Aul. 9 |
| generous | *largus, larga, largum* | `generous` | Plaut. Bacch. 401 |
| push | *trūdō, trūdere, trūsī, trūsum* | `push` | Plaut. Capt. 750 |
| sit | *assīdō (adsīdō), assīdere, assēdī* | `sit` | Plaut. Stich. 90b |
| stick | *scīpiō, scīpiōnis m.* | `stick` | Plaut. Cas. 1009 |
| daughter | *nāta (gnāta), nātae f.* | `daughter` | Plaut. Men. 834 |
| darling | *anime mī (mī anime)* | `darling` | Plaut. Curc. 99 |
| darling | *voluptās mea (mea voluptās)* | `darling` | Plaut. Mil. 1345 |
| darling | *mel meum* | `darling` | Plaut. Curc. 164 |
| rascal | *furcifer, furciferī m.* | `rascal` | Plaut. Asin. 677b |
| rascal | *verberō, verberōnis m.* | `rascal` | Plaut. Amph. 284 |
| rascal | *mastīgia, mastīgiae m.* | `rascal` | Plaut. Cas. 361 |
| rascal | *carnifex (carnufex), carnificis m.* | `rascal` | Plaut. Amph. 518 |
| I’m ashamed | *pudet, pudēre, puduit (puditum est)* | `im-ashamed` | Plaut. Ps. 281 |
| drain (a cup) | *ēbibō, ēbibere, ēbibī, ēbibitum* | `drain` | Plaut. Curc. 359 |
| stingy | *tenāx, tenācis* | `stingy` | Plaut. Capt. 289 |
| charity begins at home | *Tunica propior palliō est.* | `charity-begins-at-home` | Plaut. Trin. 1154 |
| too bad! | *Male factum.* | `too-bad` | Ter. Ph. 751 |
| be quiet | *Tacē modo.* | `be-quiet` | Plaut. Bacch. 638a |
| it’s no use | *Nihil agis.* | `its-no-use` | Plaut. Merc. 459 |
| fall on deaf ears | *surdō narrāre fābulam* | `fall-on-deaf-ears` | Ter. Heaut. 222 |
| stop it! | *Pergin'?* | `stop-it` | Plaut. Amph. 539 |
| be surprised | *mīrum nī (+ indicative)* | `be-surprised` | Ter. And. 598 |
| I’m done for! | *Disperiī!* | `im-done-for` | Plaut. Bacch. 1116c |

Two existing terms were split so that each word has a page of its own: *edepol, pol* into *edepol* and *pol*; *ēcastor, mēcastor* into *ēcastor* and *mēcastor*.

## Departures from Lewis & Short, with their notes

- *proinde*: short final e (Lewis & Short *prŏ-indē*); the note in `therefore` gives Verg. A. 11.383.
- *quāpropter*: long a (Lewis & Short's headword *quă-propter*, though its own article prints *Quāpropter?*); note in `why`.
- *Sīcine*: short final e (Lewis & Short *sīcĭnē*); note in `is-that-how-you-treat-me`, with Catull. 64.132.
- *rescīscō*: short e in *re-*, by the ruling `re-s`; note in `learn-find-out`.
- *Nōta* and *mala* in *Nōta mala rēs optima est* are in `data/quantity-exceptions.json`: Lewis & Short has *nŏta*, a mark, and *māla*, cheek, as other words.
- The citation label "Lewis & Short: eia" is in the `KEEP` list of `scripts/consonantal_j.py`; the Latin itself is written *eja*, as the loci tables write it.

## Points to look at in review

- *Quid istīc?* (`oh-all-right`): Lewis & Short does not treat the formula. The sense "very well, I give in" is read from the three places quoted (Plaut. Trin. 573, Rud. 1331b, Merc. 1004b).
- *adulter*, *moechus* (`adulterer`) are marked `audience: adult`. Left out as beyond a general lexicon or as needing a decision (in the corpus's spelling): cinaedus, scortor and scortator, stuprum, prostibulum, moechisso, concubina (a kept woman; "mistress" in that sense has no record).
- *matula* is entered under `potty` beside *matella*. In Plautus it is a chamber pot for grown men and a term of abuse.
- *lassus* (`tired`): labelled as a word of everyday speech and the poets, not in Cicero or Caesar. It may deserve to be the recommended word in a lexicon of daily life; it was left as an alternative.
- *Tunica propior palliō est* (`charity-begins-at-home`) is classical and was added as an alternative; the recommended term there is still Traupman's *Prīma cāritās incipit ā sē ipsō*, for which the record has no ancient source.
- *vidua* (`widow`): in comedy the word is as often "a woman without a husband" as a widow; the example shows that sense.
- *nūtō* in the example of `nod` (Plaut. Mil. 207) is a shake of the head in doubt; Latin has one verb for both movements, and *abnuō* for the refusal.
- *jējūnus*, *jānitor*: written as the lexicon already writes *jējūnium*, *jānua*.
- *mīrum nī* was put under `be-surprised`, whose headword is a verb; it may want a phrase record of its own ("I bet").
- *era* and *domina* have a record of their own (`mistress-of-the-house`), not a place under `master-owner`, so that the answer is of the same kind as the headword.

## Looked at and left out

The single words in this section and the next are given as the corpus spells its lemmas (no macrons, u for v, i for j), since none of them has been through Lewis & Short yet.

- **Left to the sweep of the outdoors** (trees, plants, animals, landforms): stercus, sterculinum, caenum, pedis, cuculus, ueruex, hircus, turtur, miluus, upupa, uulturius, hirudo, limax, muraena, conger, gallinaceus, iumentum, canterius, senticetum, salictum, lucus.
- **The stage and Roman institutions with no modern use:** parasitus and its family, leno, lena, atriensis, libertus, liberta, uerna, conseruus, seruulus, pedisequa, paedagogus, trapezita (it stands only inside the example of `travel-money`), syngraphus, talentum, teruncius, triobolum, tibicina, fidicina, lictor, haruspex, auspicium, praefectura, triumuir, uadimonium, compes, flagrum, furca, pistrinum as the slaves' mill.
- **Coinages made for a joke, and words found once:** dentifrangibulum, nucifrangibulum, lumbifragium, ferricrepinus, plagipatida, trifurcifer, tittibilicium, gerulifigulus, salutigerulus, scrofipascus, uerbiuelitatio, multibibus, merobibus, ulmeus and the like.
- **Proper names and their adjectives** (the corpus marks them).
- **General vocabulary with nothing comic about it,** left to the sweep by frequency (`notes/coverage/latin-frequency.md`): memoro, eloquor, reor, expeto, aduerto, incedo, abduco, uincio, diuinus, intereo, exquiro, seruio, seruitus, abstineo, attineo, consuesco, educo, redimo, subduco, prodeo, inspicio, perspicio, orno, exitium, indignus, omen, hasta.

## What remains on the candidate list

Good everyday words that the sweep noted and did not reach, by kind:

- **Small words of talk:** numquis, numnam, anne, ellum, eccere, aha, quoquam, illo, isti, eadem, dehinc, antidhac, interibi, protinam, publicitus, mordicus, penes, pone, erga, adaeque, nimio, perbene, unice, commode, docte, blande, sapienter, stulte, misere, strenue, fortiter, libere, interdius, peregri; the bare words nugae, nihilum, pudeo, potis (the lexicon has them only inside phrases); immerito as a headword.
- **Family and people:** puerpera, partus, affinitas, ancillula, uxorcula, adolescentula, amatrix, amasius, nuptus, dotatus, indotatus, prognatus, herilis.
- **Feelings, quarrels, character:** paueo, formido, discrucio, excrucio, cruciatus, lamentor, solor, miseror, collibet, infortunium, intemperiae, astutia, sycophantia, perfidia, superbia, desidia, socordia, contumelia, interminor, pernego, insimulo, criminor, maledico, obloquor, rogito, autumo, impurus, perditus, importunus, proteruus, truculentus, imperiosus, insipiens, imperitus, meticulosus, pauidus, maleuolus, beneuolens, malignus, obsequens, pudens, memor, nescius, iners, opportunus, lepide, facete, scite.
- **The house:** penus, carnarium, promptuarius, urna, amphora, cadus, seria, hirnea, scyphus, cistellula, corbula, lampas, cereus, puluinar, colus, tela, laqueus, mantelum, ornamentum, obdo, abscondo.
- **Food and drink:** merum, potatio, appotus, uinolentus, uinosus, impransus, incenatus, saturitas, polenta, pulmentum, pulpamentum, sumen, glandium, alec, assus.
- **The body:** lumbus, lien, naris, coxendix, abdomen, callum, unguiculus, exta, lippus, lippio, uentriosus, cicatricosus, despuo, languor, rabies, pestis.
- **Money:** exsoluo, renumero, defrudo, praestino, fenerato, usurarius, opulentia, munificus, egenus, mendicabulum, pauperculus.
- **Spoken phrases** seen in the plays and not yet entered: *Quid ais?* as an opening, "I say" (Plaut. Amph. 364b); *Scīn' quid …?* (Plaut. Cas. 490); *Etiam tacēs?* (Plaut. Curc. 41c); *Quid opust verbīs?* (Plaut. Amph. 615); *Ego vīderō*, "leave it to me" (Ter. Ad. 538); *Istaec rēs est* (Ter. Ad. 417–419); *Hariolāre* (Ter. Ph. 492); *Ad restim mihi quidem rēs rediit* (Ter. Ph. 686); *nec caput nec pēs sermōnī appāret* (Plaut. Asin. 729b); *ūnō in saltū lepidē aprōs capiam duōs* (Plaut. Cas. 476); *plūris est oculātus testis ūnus quam aurītī decem* (Plaut. Truc. 489); *susque dēque* (Plaut. Amph. 886; the lexicon has it under another phrase).

The lemmas of the eight plays that the lexicon still lacks and that occur four times or more there (count in brackets); many belong to the groups above:

salueo (47) memoro (38) eloquor (33) nihilum (30) asto (28) pudeo (28) fidicina (25) lepide (25) seruio (25) aduerto (23) incedo (23) nugae (23) abduco (22) rogito (22) parasitus (21) reor (21) expeto (19) seruitus (19) uae (19) uincio (19) diuinus (18) potis (18) numquis (16) autumo (15) exquiro (15) intereo (15) herilis (14) arbitratus (13) audaciter (13) cruciatus (12) exsoluo (12) exitium (11) grauidus (11) libertus (11) orno (11) proloquor (11) propitius (11) abstineo (10) atriensis (10) attineo (10) crucio (10) delinquo (10) erga (10) illo (10) inuoco (10) nimio (10) obtingo (10) spectator (10) auspicium (9) excrucio (9) fanum (9) inspicio (9) meritum (9) ornatus (9) prognatus (9) redimo (9) adorno (8) concredo (8) docte (8) ducto (8) educo (8) indignus (8) indo (8) infortunium (8) lena (8) reuenio (8) sapienter (8) stuprum (8) tarpezita (8) astutia (7) beneuolens (7) colligo (7) compes (7) consuesco (7) defrudo (7) euoco (7) insimulo (7) largior (7) macto (7) misere (7) prodeo (7) subduco (7) sycophantia (7) tibicina (7) tuum (7) accuro (6) allego (6) ample (6) blande (6) capesso (6) commonstro (6) dirumpo (6) eadem (6) emorior (6) exanimo (6) excutio (6) geminus (6) iussus (6) lustrum (6) machaera (6) onustus (6) pango (6) peculiaris (6) perspicio (6) pudicitia (6) quoquam (6) sacrifico (6) syngraphus (6) talentum (6) abigo (5) admitto (5) aduoco (5) animatus (5) antidhac (5) armiger (5) arripio (5) auceps (5) clueo (5) commode (5) compos (5) concinno (5) contraho (5) defetiscor (5) dispertio (5) exordior (5) exorno (5) fugito (5) genius (5) hymenaeus (5) impurus (5) ingratis (5) isti (5) lembus (5) machinor (5) merens (5) moratus (5) nudius (5) obsum (5) obtrunco (5) omen (5) optestor (5) paedagogus (5) plaga (5) quoquo (5) redux (5) remoror (5) scapula (5) sublino (5) tactio (5) territo (5) ulmeus (5) abitus (4) adaeque (4) aha (4) anne (4) anteeo (4) aspecto (4) attondeo (4) citus (4) commemini (4) compareo (4) concrepo (4) condigne (4) conducibilis (4) dehinc (4) dierectus (4) dotatus (4) expers (4) exsurgo (4) facete (4) flagrum (4) gallinaceus (4) hasta (4) hilarus (4) hymen (4) incubo (4) infectus (4) iniustus (4) inspecto (4) interimo (4) lacero (4) lien (4) malefactum (4) nequiter (4) occultum (4) perditus (4) pestis (4) pompa (4) potito (4) praeuertor (4) pudice (4) purus (4) quadriga (4) quantillus (4) rebito (4) redigo (4) reduco (4) rescio (4) saeuio (4) solutus (4) suffero (4) trapezita (4) uolupe (4)

The full list is made by adding the eight plays' counts and passing them to `covered_rows`; it is not kept in the repository, since it changes with every batch. `notes/coverage/latin-frequency.md` was not made again in this sweep, because other sweeps were running beside it: make it again once they are merged (`python3 scripts/latin_coverage.py --out notes/coverage/latin-frequency.md`).
