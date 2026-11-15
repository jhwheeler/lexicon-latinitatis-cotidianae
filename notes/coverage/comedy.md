# The comedy sweep: Plautus and Terence

Made on 15 November 2026. The sweep of the authors (README, "To do") was to take the classical authors one by one, those first whose vocabulary is closest to everyday life now. Caesar, Livy and Tacitus are full of the army and of Roman politics; Plautus and Terence give the words of the household, of family and neighbours, of money and errands, of quarrels and affection, and the small words of talk. This file lists what the sweep entered, what it looked at and left, and what remains. A second round on the same day entered the coarser words, the leftovers of the first round and a further pass over the plays; its parts are marked "round two".

## Sources and method

- **Plautus.** The corpus (LASLA; see `refs/README.md`) has eight plays, lemmatised by hand: Amphitruo, Asinaria, Aulularia, Bacchides, Captivi, Casina, Curculio, Epidicus. Their counts were added together with the classes of `scripts/latin_frequency.py` (`Corpus`, `lines`, `covered_rows`) and every lemma no term is headed by was listed, most frequent first. Before the sweep the eight plays had 4,713 lemmas, of which the lexicon lacked 2,025; after it, 1,894. So 131 of the plays' lemmas were closed; the other Latin entered here is phrases, words that were in the lexicon only inside a longer term, and the prose words that stand beside the comic ones (*faenerātor* beside *danīsta*).
- **Terence** is not in the corpus. The two quotation tables of the Latinitas repository (`loci-terentius.md`, `loci-plautus.md`) were checked row by row against the lexicon: nearly all their phrases were already in. The Perseus text of the six plays (PerseusDL `canonical-latinLit`, phi0134, kept outside this repository) was matched form by form against the stems the builder computes for the search (`search_stems`, `ENDINGS`), which gave a list of candidates to read by eye, not a measurement; it confirmed the Plautine list (*rescīscō, quāpropter, sīquidem, tantisper, opperior, stultitia, malitia*).
- **Every word** was looked up in Lewis & Short (`scripts/lookup.py ls`) for its sense, its quantities and the authors who use it; the register labels (*vōx cōmica: Plaut., Ter.*) rest on what Lewis & Short says of the word.
- **Every quotation cited by the line of a play** was taken from the Perseus text (Plautus ed. Leo, whose line numbers are the usual ones; Terence ed. Parry) or from the loci tables, and then checked by a script against the Perseus text of the cited lines: 346 quotations, all of which match once macrons and j are set aside (the one difference is our *ējicī* for the edition's *eici*). Parry's Terence runs one line ahead of the OCT in *Adelphoe* 618–997 and one behind in *Eunuchus* from about 390 to 1094 (so the loci table says); lines from those stretches are cited by the OCT's number, and where only Lewis & Short's act, scene and line was to hand it is given with "(Lewis & Short)". Citations of prose authors are Lewis & Short's, and say so.
- **Round two** began from a lexicon that other sweeps had enlarged: of the eight plays' 4,713 lemmas it lacked 1,875 at the start and 1,780 at the end, so 95 lemmas were closed. Its 322 quotations cited by the line of a play were checked by the same script. All match but two: our *adulēscentulum* for Parry's *adolescentulum* (Ter. Ad. 101–102), and Plaut. Asin. 39, where the Perseus file carries an editor's expansion inside *locūtu's*.
- Archaic spellings of the editions are kept in quotations (*quom, aequomst, optumast, lubēns, convorram*); clipped *-ne* has its apostrophe (*Potin' ut, Pergin', Nūptan'*).

## What was entered

Round one: 179 Latin words and phrases, 93 in 63 new records and 86 added to 73 records that had the English already.

Round two: 152 Latin words and phrases, 99 in 73 new records and 53 added to 48 records that had the English already. (*mīrum nī* is counted among the new, though it only moved from `be-surprised` to a record of its own.)

The tables of round one come first.

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

### Round two: new records

Records marked "(adult)" carry `audience: adult`.

| English | Latin | Record | First citation |
| --- | --- | --- | --- |
| adultery (adult) | *adulterium, adulteriī n.* | `adultery` | Plaut. Cas. 976 |
| agony | *cruciātus, cruciātūs m.* | `agony` | Plaut. Bacch. 687 |
| amphora | *amphora, amphorae f.* | `amphora` | Plaut. Cas. 121 |
| amphora | *cadus, cadī m.* | `amphora` | Plaut. Amph. 429 |
| at the end of one’s tether | *Ad restim rēs rediit.* | `at-the-end-of-ones-tether` | Ter. Ph. 686 |
| beat someone at their own game | *suō sibi gladiō jugulāre* | `beat-someone-at-their-own-game` | Ter. Ad. 958 |
| bleary-eyed | *lippus, lippa, lippum* | `bleary-eyed` | Plaut. Mil. 291b–292 |
| bossy | *imperiōsus, imperiōsa, imperiōsum* | `bossy` | Plaut. Asin. 410 |
| butler | *ātriēnsis, ātriēnsis m.* | `butler` | Plaut. Ps. 609 |
| callus | *callum, callī n.* | `callus` | Plaut. Pers. 305b |
| castrate | *castrō, castrāre, castrāvī, castrātum* | `castrate` | Plaut. Merc. 272 |
| catamite (adult) | *cinaedus, cinaedī m.* | `catamite` | Plaut. Men. 513 |
| chastity | *pudīcitia, pudīcitiae f.* | `chastity` | Plaut. Amph. 840 |
| chastity | *castitās, castitātis f.* | `chastity` | Cic. Leg. 2.29 (Lewis & Short) |
| childbirth | *partus, partūs m.* | `childbirth` | Plaut. Amph. 1138 |
| commit adultery (adult) | *adulterō, adulterāre, adulterāvī, adulterātum* | `commit-adultery` | Suet. Aug. 67 |
| commit adultery (adult) | *moechor, moechārī, moechātus sum* | `commit-adultery` | Catull. 94.1 (Lewis & Short) |
| commit adultery (adult) | *moechissō, moechissāre* | `commit-adultery` | Plaut. Cas. 976 |
| concubine (adult) | *concubīna, concubīnae f.* | `concubine` | Plaut. Epid. 466 |
| concubine (adult) | *paelex (pēlex), paelicis f.* | `concubine` | Plaut. Merc. 690 |
| debauchee (adult) | *gāneō, gāneōnis m.* | `debauchee` | Ter. Heaut. 1034 |
| debauchee (adult) | *nepōs, nepōtis m.* | `debauchee` | Cic. Cat. 2.7 |
| debauchery (illicit sex, as a disgrace) (adult) | *stuprum, stuprī n.* | `debauchery` | Plaut. Amph. 883 |
| debauchery (illicit sex, as a disgrace) (adult) | *impudīcitia, impudīcitiae f.* | `debauchery` | Plaut. Am. 2.2.189 (Lewis & Short) |
| dive (a low, disreputable place) (adult) | *gānea, gāneae f.* | `dive-den-of-vice` | Cic. Pis. 13 |
| dive (a low, disreputable place) (adult) | *gāneum, gāneī n.* | `dive-den-of-vice` | Plaut. Men. 703 |
| dive (a low, disreputable place) (adult) | *lustra, lustrōrum n. pl.* | `dive-den-of-vice` | Plaut. Cas. 242c |
| do wrong | *dēlinquō, dēlinquere, dēlīquī, dēlictum* | `do-wrong` | Plaut. Amph. 817 |
| drinking bout | *pōtātiō, pōtātiōnis f.* | `drinking-bout` | Plaut. Stich. 211 |
| eunuch | *eunūchus, eunūchī m.* | `eunuch` | Ter. Eun. 167 |
| eunuch | *spadō, spadōnis m.* | `eunuch` | Liv. 9.17.16 (Lewis & Short) |
| eye inflammation | *lippitūdō, lippitūdinis f.* | `eye-inflammation` | Plaut. Rud. 632 |
| flask | *ampulla, ampullae f.* | `flask` | Plaut. Merc. 927b |
| foster child | *alumnus, alumnī m.; alumna, alumnae f.* | `foster-child` | Plaut. Merc. 809 |
| go whoring (adult) | *scortor, scortārī* | `go-whoring` | Ter. Ad. 102 |
| guardian (of a child or ward) | *tūtor, tūtōris m.* | `guardian` | Plaut. Truc. 859 |
| guzzle | *ingurgitō, ingurgitāre, ingurgitāvī, ingurgitātum* | `guzzle` | Plaut. Curc. 128 |
| home and dry | *in portū nāvigō* | `home-and-dry` | Ter. And. 480 |
| I bet (I’d be surprised if not) | *mīrum nī (+ indicative)* | `i-bet` | Ter. And. 598 |
| I bet (I’d be surprised if not) | *mīra sunt nī (nisi)* | `i-bet` | Plaut. Amph. 283 |
| joker (one who talks nonsense) | *nūgātor, nūgātōris m.* | `joker-trifler` | Plaut. Mil. 1078b |
| kick against the pricks | *adversum stimulum calcēs* | `kick-against-the-pricks` | Ter. Ph. 77–78 |
| leave it to me | *Ego vīderō.* | `leave-it-to-me` | Ter. Ad. 538 |
| leave it to me | *Ego istuc cūrābō.* | `leave-it-to-me` | Plaut. Amph. 949 |
| loins | *lumbus, lumbī m.* | `loins` | Plaut. Men. 882 |
| lyre player | *fidicen, fidicinis m.* | `lyre-player` | Cic. Fam. 9.22.3 |
| lyre player | *fidicina, fidicinae f.* | `lyre-player` | Plaut. Epid. 477b |
| madam (a woman who keeps prostitutes) (adult) | *lēna, lēnae f.* | `madam-of-a-brothel` | Plaut. Asin. 178 |
| maimed | *mancus, manca, mancum* | `maimed` | Plaut. Merc. 630 |
| maimed | *dēbilis, dēbile* | `maimed` | Plaut. Merc. 630 |
| mind your own business | *Tuā quod nihil rēfert, percontārī dēsinās.* | `mind-your-own-business` | Ter. Hec. 810 |
| mind your own business | *Tuā quod nīl rēfert, nē cūrēs.* | `mind-your-own-business` | Plaut. Stich. 319–320 |
| neat wine | *merum, merī n.* | `neat-wine` | Plaut. Curc. 128 |
| neither head nor tail | *nec caput nec pēs* | `neither-head-nor-tail` | Plaut. Asin. 729b |
| nicely | *bellē* | `nicely` | Plaut. Cas. 851 |
| nicely | *lepidē* | `nicely` | Plaut. Aul. 497 |
| noose | *laqueus, laqueī m.* | `noose` | Plaut. Cas. 113 |
| orphan | *pūpillus, pūpillī m.* | `orphan` | Cic. Verr. 2.4.37 |
| orphan | *orbus, orba, orbum* | `orphan` | Ter. Ph. 125 |
| out of breath | *exanimātus, exanimāta, exanimātum* | `out-of-breath` | Plaut. Asin. 265 |
| pay off (a debt) | *exsolvō, exsolvere, exsolvī, exsolūtum* | `pay-off` | Cic. Att. 16.6.3 |
| piper | *tībīcen, tībīcinis m.* | `piper` | Plaut. Stich. 723 |
| piper | *tībīcina, tībīcinae f.* | `piper` | Plaut. Aul. 280–281 |
| pot-bellied | *ventriōsus, ventriōsa, ventriōsum* | `pot-bellied` | Plaut. Ps. 1218 |
| provisions (a household’s store of food) | *penus, penūs (penī) m./f.* | `provisions` | Plaut. Capt. 920 |
| relationship by marriage | *affīnitās (adfīnitās), affīnitātis f.* | `relationship-by-marriage` | Ter. Hec. 723 |
| relish (something eaten with bread) | *pulmentum, pulmentī n.* | `relish-with-bread` | Plaut. Aul. 316 |
| shackles | *compedēs, compedum f. pl.* | `shackles` | Plaut. Capt. 734 |
| spiteful | *malevolus (malevolēns), malevola, malevolum* | `spiteful` | Plaut. Curc. 477 |
| spleen | *liēn, liēnis m.* | `spleen` | Plaut. Curc. 236b |
| spleen | *splēn, splēnis m.* | `spleen` | Plin. NH 23.25 (Lewis & Short) |
| sponger | *parasītus, parasītī m.* | `sponger` | Plaut. Men. 505 |
| talk nonsense | *nūgor, nūgārī, nūgātus sum* | `talk-nonsense` | Plaut. Epid. 478b |
| talk nonsense | *hariolor, hariolārī* | `talk-nonsense` | Ter. Ph. 492 |
| titbit | *pulpāmentum, pulpāmentī n.* | `titbit` | Plaut. Curc. 90 |
| torment | *cruciō, cruciāre, cruciāvī, cruciātum* | `torment` | Plaut. Capt. 600 |
| torment | *excruciō, excruciāre, excruciāvī, excruciātum* | `torment` | Plaut. Bacch. 1092 |
| torment | *discruciō, discruciāre* | `torment` | Plaut. Aul. 105 |
| trifles | *nūgae, nūgārum f. pl.* | `trifles` | Plaut. Asin. 808 |
| trifles | *trīcae, trīcārum f. pl.* | `trifles` | Plaut. Most. 572 |
| two heads are better than one | *Nēmō sōlus satis sapit.* | `two-heads-are-better-than-one` | Plaut. Mil. 885 |
| uninvited | *invocātus, invocāta, invocātum* | `uninvited` | Plaut. Capt. 70 |
| urn | *urna, urnae f.* | `urn` | Plaut. Ps. 157 |
| vile (of a person: morally filthy) | *impūrus, impūra, impūrum* | `vile` | Plaut. Bacch. 884 |
| violate (a woman: force or dishonour her) (adult) | *vitiō, vitiāre, vitiāvī, vitiātum* | `violate-a-woman` | Ter. Ad. 466–467 |
| violate (a woman: force or dishonour her) (adult) | *comprimō, comprimere, compressī, compressum* | `violate-a-woman` | Plaut. Aul. 28 |
| violate (a woman: force or dishonour her) (adult) | *stuprō, stuprāre, stuprāvī, stuprātum* | `violate-a-woman` | Plaut. Aul. 36 |
| what’s got into you? | *Quae tē intemperiae tenent?* | `whats-got-into-you` | Plaut. Epid. 475b |
| while there’s life there’s hope | *Modo liceat vīvere, est spēs.* | `while-theres-life-theres-hope` | Ter. Heaut. 981 |
| while there’s life there’s hope | *Dum anima est, spēs est.* | `while-theres-life-theres-hope` | Cic. Att. 9.10.3 |
| whoremonger (adult) | *scortātor, scortātōris m.* | `whoremonger` | Plaut. Amph. 287 |
| without a dowry | *indōtātus, indōtāta, indōtātum* | `without-a-dowry` | Ter. Ad. 729 |
| without dinner | *incēnātus, incēnāta, incēnātum* | `without-dinner` | Plaut. Aul. 368 |
| without lunch | *imprānsus (inprānsus), imprānsa, imprānsum* | `without-lunch` | Plaut. Amph. 254 |
| woman in labour | *puerpera, puerperae f.* | `woman-in-labour` | Plaut. Amph. 1092 |
| do you know what? | *Scīn' quid …?* | `you-know-what` | Plaut. Men. 207 |
| you’ll catch it | *Vāpulābis.* | `youll-catch-it` | Plaut. Merc. 168 |
| young master (the master’s son, as the slaves call him) | *erīlis fīlius* | `young-master` | Plaut. Bacch. 233 |
| you’re killing me (with talk, delay or suspense) | *Ēnicās.* | `youre-killing-me` | Plaut. Merc. 157 |

### Round two: terms added to existing records

| English | Latin | Record | First citation |
| --- | --- | --- | --- |
| able (be able to) | *potis (pote)* | `able` | Plaut. Amph. 693 |
| abroad | *peregrī* | `abroad` | Plaut. Pers. 29 |
| abuse (insults, rude words) | *contumēlia, contumēliae f.* | `abuse-insults` | Plaut. Asin. 489 |
| ask | *rogitō, rogitāre, rogitāvī* | `ask` | Plaut. Asin. 578b |
| be quiet | *Etiam tacēs?* | `be-quiet` | Plaut. Curc. 41c |
| belly | *abdomen, abdominis n.* | `belly` | Plaut. Curc. 323 |
| by day | *interdius* | `by-day` | Plaut. Aul. 72 |
| careless | *sōcors, sōcordis* | `careless` | Plaut. Cist. 674 |
| charge (an accusation) | *īnsimulō, īnsimulāre, īnsimulāvī, īnsimulātum* | `charge-accusation` | Plaut. Amph. 820 |
| cheeky | *protervus, proterva, protervum* | `cheeky` | Plaut. Bacch. 612 |
| deny (say that something is not true) | *pernegō, pernegāre, pernegāvī, pernegātum* | `deny` | Plaut. Aul. 765 |
| disaster | *īnfortūnium, īnfortūniī n.* | `disaster` | Plaut. Amph. 286 |
| disturb | *obloquor, obloquī, oblocūtus sum (+ dat.)* | `disturb` | Plaut. Cist. 753b |
| drunk (adult) | *vīnolentus (vīnulentus), vīnolenta, vīnolentum* | `drunk` | Plaut. Cist. 159 |
| drunk (adult) | *appōtus (adpōtus), appōta, appōtum* | `drunk` | Plaut. Curc. 354 |
| especially | *ūnicē* | `especially` | Plaut. Bacch. 207 |
| grand (magnificent, splendid) | *opiparus, opipara, opiparum* | `grand` | Plaut. Mil. 107 |
| greet | *salvēre jubeō* | `greet` | Plaut. Cas. 1 |
| grumpy | *truculentus, truculenta, truculentum* | `grumpy` | Plaut. Truc. 265 |
| hide (a thing, or a fact) | *abscondō, abscondere, abscondī (abscondidī), absconditum* | `hide-conceal` | Plaut. Merc. 360 |
| in short | *Quid opus est verbīs?* | `in-short` | Plaut. Amph. 615 |
| just (exactly) | *examussim* | `just-exactly` | Plaut. Amph. 843 |
| kill two birds with one stone | *ūnō in saltū aprōs capere duōs* | `kill-two-birds-with-one-stone` | Plaut. Cas. 476 |
| lazy | *iners, inertis* | `lazy` | Ter. And. 608 |
| lazy | *dēsidia, dēsidiae f.* | `lazy` | Plaut. Bacch. 1083 |
| lover | *amāsius, amāsiī m.* | `lover` | Plaut. Cas. 590 |
| nonsense! | *Gerrae!* | `nonsense` | Plaut. Asin. 600 |
| nonsense! | *Hariolāre.* | `nonsense` | Ter. Ph. 492 |
| old (of people: aged) | *dēcrepitus, dēcrepita, dēcrepitum* | `old-of-people` | Plaut. Asin. 863 |
| prostitute (adult) | *prōstibulum, prōstibulī n.* | `prostitute` | Plaut. Aul. 285 |
| prostitute (adult) | *quaestum corpore facere* | `prostitute` | Plaut. Poen. 1140 |
| pub | *thermopōlium (thermipōlium), thermopōliī n.* | `pub` | Plaut. Curc. 292 |
| rascal | *propudium, propudiī n.* | `rascal` | Plaut. Curc. 190b |
| refund | *renumerō, renumerāre, renumerāvī, renumerātum* | `refund` | Plaut. Bacch. 516 |
| rude (impolite, ill-mannered) | *importūnus, importūna, importūnum* | `rude-impolite` | Cic. Clu. 177 |
| say | *autumō, autumāre, autumāvī, autumātum* | `say` | Plaut. Amph. 752 |
| screw (have sex with (vulgar)) (adult) | *cubō, cubāre, cubuī, cubitum (cum aliquā, cum aliquō)* | `screw-sexual` | Plaut. Amph. 112 |
| seeing is believing | *Plūris est oculātus testis ūnus quam aurītī decem.* | `seeing-is-believing` | Plaut. Truc. 489 |
| shy | *meticulōsus (metuculōsus), meticulōsa, meticulōsum* | `shy` | Plaut. Amph. 293 |
| someone | *numquis (numquī), numqua, numquid* | `someone` | Plaut. Men. 620 |
| spit out | *dēspuō, dēspuere* | `spit-out` | Plaut. Asin. 39 |
| stand | *astō (adstō), astāre, astitī* | `stand` | Plaut. Aul. 528 |
| stingy | *malignus, maligna, malignum* | `stingy` | Plaut. Bacch. 401 |
| that’s right | *Istaec rēs est.* | `thats-right` | Ter. Ad. 418 |
| there! (see? there you are) | *Eccere!* | `there-you-see` | Plaut. Mil. 207 |
| thief | *homō trium litterārum* | `thief` | Plaut. Aul. 325b |
| tired | *dēfessus, dēfessa, dēfessum* | `tired` | Ter. Ad. 713 |
| tooth and nail | *mordicus* | `tooth-and-nail` | Plaut. Curc. 597 |
| tooth and nail | *manibus pedibus* | `tooth-and-nail` | Ter. And. 676 |
| tutor | *paedagōgus, paedagōgī m.* | `tutor` | Plaut. Bacch. 138 |
| very (before adjectives and adverbs) | *nimis* | `very` | Plaut. Aul. 497 |
| well | *perbene* | `well-adverb` | Plaut. Aul. 186b |
| worthless | *nihilī* | `worthless` | Plaut. Asin. 472 |

Other changes of round two:

- `charity-begins-at-home`: Plautus's *Tunica propior palliō est* is now the recommended term and Traupman's *Prīma cāritās incipit ā sē ipsō* an alternative, with the comment that no ancient source was found for it. A composed example was added, since the flash card shows an example only if it has a form of the term and Plautus writes *palliōst*.
- `tired`: *lassus* is now recommended beside *fessus* (which stays first), and *dēfessus* was added. A search of the twenty plays of Plautus and the six of Terence found *lassus* twelve times, *dēfessus* thirteen times and *fessus* not once; Lewis & Short says *lassus* is "not in Cic. or Caes.".
- `be-surprised`: *mīrum nī* was taken out and given the phrase record `i-bet`, with *mīra sunt nī (nisi)* beside it.
- `drunk` and `screw-sexual` also received an example that contains their first term (Plaut. Amph. 574; Ter. Hec. 393), since the flash card shows an example only if it has a form of the answer.

## Departures from Lewis & Short, with their notes

- *proinde*: short final e (Lewis & Short *prŏ-indē*); the note in `therefore` gives Verg. A. 11.383.
- *quāpropter*: long a (Lewis & Short's headword *quă-propter*, though its own article prints *Quāpropter?*); note in `why`.
- *Sīcine*: short final e (Lewis & Short *sīcĭnē*); note in `is-that-how-you-treat-me`, with Catull. 64.132.
- *rescīscō*: short e in *re-*, by the ruling `re-s`; note in `learn-find-out`.
- *Nōta* and *mala* in *Nōta mala rēs optima est* are in `data/quantity-exceptions.json`: Lewis & Short has *nŏta*, a mark, and *māla*, cheek, as other words.
- The citation label "Lewis & Short: eia" is in the `KEEP` list of `scripts/consonantal_j.py`; the Latin itself is written *eja*, as the loci tables write it.

## Points to look at in review

- *Quid istīc?* (`oh-all-right`): Lewis & Short does not treat the formula. The sense "very well, I give in" is read from the three places quoted (Plaut. Trin. 573, Rud. 1331b, Merc. 1004b).
- *adulter*, *moechus* (`adulterer`) are marked `audience: adult`. The coarser words left out in round one were entered in round two, each with `audience: adult`; see "The coarser words" below.
- *matula* is entered under `potty` beside *matella*. In Plautus it is a chamber pot for grown men and a term of abuse.
- *lassus* (`tired`): labelled as a word of everyday speech and the poets, not in Cicero or Caesar. Round two made it recommended beside *fessus*, which is still the first term and so the answer of the flash card; whether *lassus* should come first is open.
- *Tunica propior palliō est* (`charity-begins-at-home`) is the recommended term since round two, Traupman's *Prīma cāritās incipit ā sē ipsō* an alternative.
- *vidua* (`widow`): in comedy the word is as often "a woman without a husband" as a widow; the example shows that sense.
- *nūtō* in the example of `nod` (Plaut. Mil. 207) is a shake of the head in doubt; Latin has one verb for both movements, and *abnuō* for the refusal.
- *jējūnus*, *jānitor*: written as the lexicon already writes *jējūnium*, *jānua*.
- *mīrum nī* has its own phrase record `i-bet` since round two; Lewis & Short s.v. *mīrus* gives the sense in so many words.
- *era* and *domina* have a record of their own (`mistress-of-the-house`), not a place under `master-owner`, so that the answer is of the same kind as the headword.

Round two:

- `catamite`: *cinaedus* is entered in its ancient sense. The record `gay` already lists the word as one to avoid for the modern sense; the two do not contradict each other, but they should be read together.
- `commit-adultery`: the example for *adulterō* is from the Vulgate (Matt. 5.32), as Lewis & Short quotes it. The one place where the plays have the verb (Plaut. Bacch. 268) uses it of falsifying, and Lewis & Short's classical places for the sexual sense are single words.
- `seeing-is-believing`: Plautus's *Plūris est oculātus testis ūnus quam aurītī decem* was added as an alternative; Traupman's modern *Vidē et crēde* is still recommended. By the ruling on "charity begins at home" the two might change places.
- `while-theres-life-theres-hope`: *Dum anima est, spēs est* is our direct form of what Cicero reports in indirect speech (*dum anima est, spēs esse dīcitur*, Att. 9.10.3); the comment says so. Terence's line is the recommended term.
- `you-know-what`: the term is headed *Scīn' quid …?* with an ellipsis, since the formula never stands alone in the plays.
- `thief`: *homō trium litterārum* is a joke, not a name for a thief; the comment says so.
- `tooth-and-nail`: *manibus pedibus* is given as Terence has it; Lewis & Short's lemma is *manibus pedibusque*.
- `shackles`: headed in the plural, *compedēs, compedum*; Plautus has the genitive *compedium*, and Lewis & Short finds no nominative singular in use.
- `neat-wine`: *merum* as a noun is "poet. and in post-Aug. prose" in Lewis & Short; it is the only word for the thing.
- `orphan`: *pūpillus* (an orphan boy, a ward) is recommended and *orbus* the alternative; Latin has no one word that covers both sexes and both parents.
- `mind-your-own-business`: Ter. Hec. 810 is Parry's number. The Hecyra's numbers agree with the OCT where the loci table allows a check (lines 84 and 769), but line 810 itself was not checked against the OCT.
- Words of the stage entered against round one's judgement, because each has a plain English headword today: *parasītus* (`sponger`), *ātriēnsis* (`butler`), *tībīcen* and *tībīcina* (`piper`), *fidicen* and *fidicina* (`lyre-player`), *compedēs* (`shackles`), *paedagōgus* (under `tutor`), *erīlis fīlius* (`young-master`).

### The coarser words

Entered in round two with `audience: adult`: *cinaedus* (`catamite`); *scortor* (`go-whoring`); *scortātor* (`whoremonger`); *stuprum, impudīcitia* (`debauchery`); *vitiō, comprimō, stuprō* (`violate-a-woman`); *adulterium* (`adultery`); *adulterō, moechor, moechissō* (`commit-adultery`); *concubīna, paelex* (`concubine`); *lēna* (`madam-of-a-brothel`); *gānea, gāneum, lustra* (`dive-den-of-vice`); *gāneō, nepōs* (`debauchee`); and, added to records that had the mark already, *prōstibulum* and *quaestum corpore facere* (`prostitute`) and *cubō cum aliquā* (`screw-sexual`). Beside them, without the mark: *amāsius* (`lover`), *propudium* (`rascal`), *eunūchus, spadō* (`eunuch`), *castrō* (`castrate`), *pudīcitia, castitās* (`chastity`), *impūrus* (`vile`).

Already in the lexicon and so not entered again: *meretrīx, scortum, lupa* (`prostitute`), *lēnō, lēnōcinium* (`pimp`), *lupānar, fornix* (`brothel`), *amīca* with its comic sense (`lover`), *futuō* and *subigitō* (`screw-sexual`), *mentula, cunnus, cūlus*.

Left out:

- The plain obscenities that Plautus and Terence do not use and that belong to Catullus, Martial and the graffiti: *paedīcō (pēdīcō), irrumō, fellō, verpa, landīca, pathicus*. Lewis & Short prints most of them, but they are not words of the comic stage, and a decision on them belongs with the records for the body and for sex, not with this sweep.
- Diminutives and derivatives that add no new English headword: *scortillum, meretrīcula, meretrīcius, lēnōnius, amātiō, amātrīx, dēamō, subigitātiō, subigitātrīx, stuprātor, adulterīnus* in its sexual sense.

## Looked at and left out

The single words in this section and the next are given as the corpus spells its lemmas (no macrons, u for v, i for j), since none of them has been through Lewis & Short yet.

- **Left to the sweep of the outdoors** (trees, plants, animals, landforms): stercus, sterculinum, caenum, pedis, cuculus, ueruex, hircus, turtur, miluus, upupa, uulturius, hirudo, limax, muraena, conger, gallinaceus, iumentum, canterius, senticetum, salictum, lucus.
- **The stage and Roman institutions with no modern use:** the family of parasitus (parasitor, parasitatio), uerna, conseruus, seruulus, pedisequa, trapezita (it stands only inside the example of `travel-money`), syngraphus, talentum, teruncius, triobolum, lictor, haruspex, auspicium, praefectura, triumuir, uadimonium, flagrum, furca, pistrinum as the slaves' mill. (Round two entered those of this group that answer a plain English headword: see the review points.)
- **Coinages made for a joke, and words found once:** dentifrangibulum, nucifrangibulum, lumbifragium, ferricrepinus, plagipatida, trifurcifer, tittibilicium, gerulifigulus, salutigerulus, scrofipascus, uerbiuelitatio, multibibus, merobibus, ulmeus and the like.
- **Proper names and their adjectives** (the corpus marks them).
- **General vocabulary with nothing comic about it,** left to the sweep by frequency (`notes/coverage/latin-frequency.md`): memoro, eloquor, reor, expeto, aduerto, incedo, abduco, uincio, diuinus, intereo, exquiro, seruio, seruitus, libertus, liberta, abstineo, attineo, consuesco, educo, redimo, subduco, prodeo, inspicio, perspicio, orno, exitium, indignus, omen, hasta.

## What remains on the candidate list

Good everyday words that the sweep noted and did not reach, by kind:

- **Small words of talk:** numnam, anne, ellum, aha, quoquam, illo, isti, eadem, dehinc, antidhac, interibi, protinam, publicitus, penes, pone, erga, adaeque, nimio, commode, docte, blande, sapienter, stulte, misere, strenue, fortiter, libere; the bare words nihilum and pudeo (the lexicon has them only inside phrases or as *nihilī*); immerito as a headword.
- **Family and people:** ancillula, uxorcula, adolescentula, amatrix, nuptus, dotatus, prognatus.
- **Feelings, quarrels, character:** paueo, formido, lamentor, solor, miseror, collibet, astutia, sycophantia, perfidia, superbia, socordia, interminor, criminor, maledico, perditus, insipiens, imperitus, pauidus, beneuolens, obsequens, pudens, memor, nescius, opportunus, facete, scite.
- **The house:** carnarium, promptuarius, seria, hirnea, scyphus, cistellula, corbula, lampas, cereus, puluinar, colus, tela, mantelum, ornamentum, obdo.
- **Food and drink:** uinosus, saturitas, polenta, sumen, glandium, alec, assus.
- **The body:** naris, coxendix, unguiculus, exta, lippio, cicatricosus, languor, rabies, pestis.
- **Money:** defrudo, praestino, fenerato, usurarius, opulentia, munificus, egenus, mendicabulum, pauperculus.
- **Spoken phrases:** all those listed after round one are now in, but two. *Quid ais?* as an opening ("I say", Plaut. Amph. 364b) stays under `what-exclamation`, since Lewis & Short gives the question only as "what do you say?" in its several shades. *susque dēque* was in the lexicon already (`neither-here-nor-there`).

The lemmas of the eight plays that the lexicon still lacks after round two and that occur four times or more there (count in brackets). Some are in under another form and so still count as lacking: *nihilī* for nihilum, *salvēre jubeō* for salueo, *compedēs* for compes, *exanimātus* for exanimo, *dēfessus* for defetiscor, *erīlis fīlius* for herilis. Most of the rest is general vocabulary, left to the sweep by frequency:

salueo (47) memoro (38) eloquor (33) nihilum (30) pudeo (28) seruio (25) aduerto (23) incedo (23) abduco (22) reor (21) expeto (19) seruitus (19) uae (19) uincio (19) diuinus (18) exquiro (15) intereo (15) herilis (14) arbitratus (13) audaciter (13) exitium (11) grauidus (11) libertus (11) orno (11) proloquor (11) propitius (11) abstineo (10) attineo (10) erga (10) illo (10) inuoco (10) nimio (10) obtingo (10) spectator (10) auspicium (9) fanum (9) inspicio (9) meritum (9) ornatus (9) prognatus (9) redimo (9) adorno (8) concredo (8) docte (8) ducto (8) educo (8) indignus (8) indo (8) reuenio (8) sapienter (8) tarpezita (8) astutia (7) beneuolens (7) colligo (7) compes (7) consuesco (7) defrudo (7) euoco (7) largior (7) macto (7) misere (7) prodeo (7) subduco (7) sycophantia (7) tuum (7) accuro (6) allego (6) ample (6) blande (6) capesso (6) commonstro (6) dirumpo (6) eadem (6) emorior (6) exanimo (6) excutio (6) geminus (6) iussus (6) machaera (6) onustus (6) pango (6) peculiaris (6) perspicio (6) quoquam (6) sacrifico (6) syngraphus (6) talentum (6) abigo (5) admitto (5) aduoco (5) animatus (5) antidhac (5) armiger (5) arripio (5) auceps (5) clueo (5) commode (5) compos (5) concinno (5) contraho (5) defetiscor (5) dispertio (5) exordior (5) exorno (5) fugito (5) genius (5) hymenaeus (5) ingratis (5) isti (5) lembus (5) machinor (5) merens (5) moratus (5) nudius (5) obsum (5) obtrunco (5) omen (5) optestor (5) plaga (5) quoquo (5) redux (5) remoror (5) scapula (5) sublino (5) tactio (5) territo (5) ulmeus (5) abitus (4) adaeque (4) aha (4) anne (4) anteeo (4) aspecto (4) attondeo (4) citus (4) commemini (4) compareo (4) concrepo (4) condigne (4) conducibilis (4) dehinc (4) dierectus (4) dotatus (4) expers (4) exsurgo (4) facete (4) flagrum (4) gallinaceus (4) hasta (4) hilarus (4) hymen (4) incubo (4) infectus (4) iniustus (4) inspecto (4) interimo (4) lacero (4) malefactum (4) nequiter (4) occultum (4) perditus (4) pestis (4) pompa (4) potito (4) praeuertor (4) pudice (4) purus (4) quadriga (4) quantillus (4) rebito (4) redigo (4) reduco (4) rescio (4) saeuio (4) solutus (4) suffero (4) trapezita (4) uolupe (4)

The full list is made by adding the eight plays' counts and passing them to `covered_rows`; it is not kept in the repository, since it changes with every batch. `notes/coverage/latin-frequency.md` was not made again in this sweep, because other sweeps were running beside it: make it again once they are merged (`python3 scripts/latin_coverage.py --out notes/coverage/latin-frequency.md`).
