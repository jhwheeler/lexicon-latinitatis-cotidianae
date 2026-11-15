# The outdoors: forest, field and garden

The candidate list of the sweep of 15 November 2026 and what became of each word. The aim was the vocabulary of a walk in a European deciduous and mountain forest, and the basic words of the garden and the smallholding: the general word for each thing and the kinds a family meets and names, not a catalogue of species.

## How the list was made

1. **From the authors.** `python3 scripts/latin_frequency.py --work <work> --missing` lists the lemmas of a work that head no term. The lists for Vergil (Eclogues, Georgics, Aeneid), Cato *De agricultura*, Horace, Ovid (*Metamorphoses*, *Fasti*), Lucretius, Tibullus and the book of Pliny the corpus has (book 37, on gems, of little use here) were merged: 6,286 missing lemmas. The head of each word’s Lewis & Short article was searched for words of the domain (tree, plant, bird, rock, stream …), which kept 847, 493 of them nouns; those were read by eye.
2. **From the walk.** A checklist of some 330 English words (trees, plants, parts of a plant, mammals, birds, reptiles, small creatures, homes and traces, landforms, woods, waters, sky, then the garden: beds, verbs, tools, fruit and vegetables) was checked against the headwords, `also` words and glosses of the records. About 175 had no entry; the commoner ones were looked up in the reference works and then in Lewis & Short.
3. Columella, Varro’s *Res rusticae* and Pliny’s books on trees, plants and animals are not in the corpus; their words came through Lewis & Short’s citations.

Every Latin word was confirmed in Lewis & Short (`scripts/lookup.py ls`). Verse examples were read in the Perseus texts of Vergil, Horace, Ovid and Tibullus and their words and line numbers checked against the LASLA corpus; the first Eclogue is numbered as modern editions number it, one lower than Greenough’s text and Lewis & Short after line 17.

## Entered: 138 Latin words

### Trees and shrubs

- maple: *acer*
- birch: *betula*
- alder: *alnus*
- fir: *abiēs*
- spruce (the tree): *picea*
- larch: *larix*
- juniper: *jūniperus*
- yew: *taxus*
- cypress: *cupressus*
- myrtle: *myrtus*
- plane tree: *platanus*
- holm oak: *īlex*
- elder (the tree): *sambūcus*
- box (the evergreen tree): *buxus*
- manna ash: *ornus*
- hawthorn: *spīna alba*
- willow (existing record): *salictum*

### Flowers, herbs, weeds, grasses, fungi

- thistle: *carduus*
- bur: *lappa*
- mistletoe: *viscum*
- lichen: *līchēn*
- rush (the plant): *juncus*
- sedge: *cārex*, *ulva*
- reed: *harundō*, *canna*, *calamus*
- clover: *trifolium*
- mallow: *malva*
- hemlock: *cicūta*
- wormwood: *absinthium*
- broom (the shrub): *genista*
- heather: *erīcē*
- narcissus: *narcissus*
- crocus: *crocus*
- mushroom (existing record): *bōlētus*
- undergrowth (existing record): *dūmus*, *sentis*, *virgulta*, *fruticētum*
- weed (an unwanted plant): *herba*, *lolium*
- sorrel: *rumex*

### Parts of a plant

- bud: *gemma*
- foliage: *frōns*
- vine shoot: *palmes*, *pampinus*
- tendril: *clāvicula*
- withy: *vīmen*
- resin: *rēsīna*
- pitch (the black tarry stuff): *pix*
- bulb (of a plant): *bulbus*

### Mammals

- badger: *mēlēs*
- marten: *martēs*
- dormouse: *glīs*
- lynx: *lynx*
- roe deer: *caprea*, *capreolus*
- fawn: *hinnuleus*
- chamois: *rūpicapra*
- deer (existing record): *damma*
- antler: *cornū*
- bristle: *saeta*

### Birds

- nightingale: *luscinia*, *philomēla*
- cuckoo: *cucūlus*
- heron: *ardea*
- hoopoe: *upupa*
- kingfisher: *alcēdō*
- goldfinch: *carduēlis*
- chaffinch: *fringilla*
- tit (the small bird): *pārus*
- wren: *rēgāliolus*
- jay: *garrulus*
- owl (existing record): *ulula*, *strix*
- kite (the bird of prey): *mīlvus*
- turtle dove: *turtur*

### Reptiles, amphibians and small creatures

- viper: *vīpera*
- snake (existing record): *coluber*, *natrix*
- newt: *stēlliō*
- salamander: *salamandra*
- slug: *līmāx*
- leech: *hirūdō*
- horsefly (existing record): *asīlus*
- dragonfly: *lībellula*
- cobweb (existing record): *tēla*

### Homes and traces

- lair: *cubīle*, *lustrum*, *latebra*
- dung: *fimus*, *stercus*, *laetāmen*

### Landforms, woods and waters

- grove: *nemus*, *lūcus*, *arbustum*
- glade: *saltus*
- crag: *cautēs*
- flint: *silex*
- pebble: *calculus*, *lapillus*
- cave (existing record): *caverna*
- swamp (existing record): *ūlīgō*, *lāma*
- torrent: *torrēns*
- ford: *vadum*
- fog (existing record): *cālīgō*

### Garden and smallholding

- flower bed (existing record): *ārea*, *pulvīnus*
- vineyard: *vīnea*
- furrow: *sulcus*
- water (plants) (existing record): *irrigō*
- weed (pull up weeds): *runcō*, *sāriō*
- prune (cut back a tree or vine): *putō*, *amputō*
- graft: *īnserō*, *īnsitiō*
- stake (a post or prop for plants): *pālus*, *ridica*, *adminiculum*
- transplant: *trānsferō*
- nursery (where young plants are raised): *sēminārium*, *plantārium*
- ripen: *mātūrēscō*
- rot: *putrēscō*
- barren: *sterilis*
- sickle: *falx*
- pitchfork: *furca*
- hoe (existing record): *rāstrum*, *bidēns*
- sow (existing record): *plantō*
- farmer (existing record): *arātor*
- turnip: *rāpum*
- fennel: *faeniculum*
- rye: *secāle*
- millet: *milium*

Also: *laurel* now finds the bay (*laurus*), *bracken* the fern (*filix*), *boulder* the rock (*saxum*), *sap* the juice (*sūcus*), *bog* and *fen* the swamp, *wilt* the entry for fading; and the general records (tree, bird, flower, plant, animal, insect, garden, forest, mountain, stream) now link to their kinds.

## Round three: 131 more Latin words

A third round, the same day, took what round two left: the rest of the walk and the garden, the authors' words that had been read and not entered, and the adjectives and verbs of the field. 72 new records, and new words in 26 existing ones. The method was the same; the candidate list was made again against the lexicon as it then stood (6,081 missing lemmas in the outdoor works, 784 of them with a word of the domain in the head of their Lewis & Short article). Words of general use among the 2,500 commonest lemmas (*cavus, āridus, fēcundus, arvum, pābulum, jūmentum*) were left to the sweep in rank order.

### Trees, shrubs and plants

- holly: *aquifolium*
- cedar: *cedrus*
- privet: *ligustrum*
- strawberry tree: *arbutus*
- wayfaring tree: *vīburnum*
- cork oak: *sūber*
- thorn bush: *veprēs*
- honeysuckle: *periclymenos*
- bindweed: *convolvulus*
- buttercup: *rānunculus*
- foxglove: *digitālis purpurea*
- monkshood: *aconītum*
- rue (the herb): *rūta*
- tulip: *tulipa*
- currant (the garden berry): *ribes*
- gooseberry: *grossulāria*
- rhubarb: *rheubarbarum*, *rhecoma*
- hazel (existing record): *corylētum*
- sedge (existing record): *cārectum*
- undergrowth (existing record): *spīnētum*
- grass (existing record): *virectum*
- pine (existing record): *pīnētum*
- olive tree (existing record): *olīvētum*
- oak (existing record): *quernus*

### Parts of a plant and what lies on the ground

- catkin: *iūlus*
- oak gall: *galla*
- berry (existing record): *acinus*
- stalk (existing record): *culmus*
- stubble: *stipula*
- brushwood (cut or fallen twigs): *sarmenta*, *rāmālia*
- sheaf: *manipulus*, *merges*
- torch (a burning brand) (existing record): *taeda*
- pumice: *pūmex*
- whetstone: *cōs*
- mud (existing record): *līmus*

### Animals and their parts

- ferret: *viverra*
- shrew (the small animal): *sorex*
- slow-worm: *caecilia*
- centipede: *centipeda*, *millepeda*
- woodlouse: *oniscus*, *multipeda*
- coot: *fulica*
- moth (existing record): *tinea*
- claw: *unguis*
- fur (existing record): *villus*
- fleece: *vellus*
- wallow (a muddy place where pigs roll): *volūtābrum*
- goat (existing record): *hircus*
- pig (existing record): *scrōfa*

### Bees

- honeycomb: *favus*
- drone (the male bee): *fūcus*
- beekeeper: *mellārius*, *apiārius*
- beehive (existing record): *apiārium*

### Farm and garden: things

- ploughshare: *vōmer*
- yoke: *jugum*
- harrow: *crātis*, *irpex*, *occō*
- manger: *praesaepe*
- sheepfold (existing record): *caulae*
- basket (existing record): *fiscina*, *fiscella*, *calathus*
- snare: *laqueus*, *pedica*
- scarecrow: *terricula*, *formīdō*
- greenhouse: *speculāria*
- trellis: *cantērius*
- planting hole: *scrobis*

### Farm and garden: tasks

- propagate (raise new plants from a parent): *propāgō* the verb, *propāgō* the layer
- uproot: *ērādīcō*, *exstirpō*
- thresh: *terō*, *trītūra*
- manure (spread dung on the soil): *stercorō*
- tame (make an animal tame): *domō*, *mānsuēfaciō*
- dig (existing record): *dēfodiō*
- graze (of animals) (existing record): *dēpāscō*

### Adjectives of the field

- leafy: *frondōsus*, *frondeus*
- shady: *umbrōsus*, *opācus*
- mossy: *muscōsus*
- thorny: *spīnōsus*
- grassy: *herbōsus*, *grāmineus*
- rocky: *saxōsus*, *lapidōsus*
- marshy: *palūster*
- muddy: *līmōsus*, *lutulentus*
- wooded: *nemorōsus*, *silvōsus*
- dewy: *roscidus*
- damp (existing record): *ūdus*, *ūvidus*
- shaggy: *hirsūtus*, *hirtus*, *villōsus*, *saetōsus*
- winged: *pennātus*, *ālātus*
- horned: *cornūtus*, *corniger*
- tame: *mānsuētus*, *cicur*
- edible: *ēsculentus*, *edūlis*
- productivity (of fields, mines) (existing record): *ferāx*

### Verbs of the field

- come into leaf: *frondēscō*, *frondeō*
- sprout (put forth shoots) (existing record): *gemmō*
- dry up (existing record): *ārēscō*, *āreō*
- fade (lose colour, strength or freshness) (existing record): *flaccēscō*
- hatch (bring young out of the egg): *exclūdō*
- flutter: *volitō*
- swim (existing record): *nō*
- drip: *stillō*
- gush: *scateō*
- gnaw: *rōdō*
- shade (cast shade on): *opācō*, *obumbrō*

Also: *polecat* now finds the ferret, *wolfsbane* the monkshood, *brier* the thorn bush, *apiary* the beekeeper and the beehive, *wilt* and *droop* the entry for fading, *stony* the entry for rocky, *bristly* and *hairy (of an animal)* the entry for shaggy; *wildcat* no longer points to the lynx, which was wrong.

## Identifications that are not certain

- *picea* (spruce): Lewis & Short makes it the pitch-pine; botanists give the name to the spruces.
- *abiēs* (fir): the silver fir in Lewis & Short; the ancient names do not keep fir and spruce apart.
- *ornus* (manna ash): “the wild mountain-ash” in Lewis & Short; not the rowan.
- *spīna alba* (hawthorn): “whitethorn, hawthorn” in Lewis & Short; which shrub each author means is unsure.
- *mēlēs* (badger): “a marten or badger” in Lewis & Short. *martēs* (marten): one doubtful line of Martial.
- *caprea, capreolus* (roe deer) and *damma* (deer): Lewis & Short’s glosses run from roe to chamois to antelope.
- *fringilla* (chaffinch): “perhaps the robin; according to others, the chaffinch”. *rēgāliolus* (wren): “perhaps the wren”.
- *stēlliō* (newt): “a newt” in Lewis & Short, with the gecko named as the species.
- *erīcē* (heather): “heath, broom, ling”. *secāle* (rye): “rye; or, according to others, black spelt”. *rumex* (sorrel): also the docks.
- *ridica* (stake): the length of its first vowel is not marked in Lewis & Short or de Vaan, and is left unmarked.

Round three:

- *aquifolium* (holly): “the holly-tree, or the scarlet holm” in Lewis & Short.
- *cedrus* (cedar): Lewis & Short takes it for the prickly juniper; the cedar of Lebanon bears the same name.
- *periclymenos* (honeysuckle): “a climbing plant, the woodbine or honeysuckle”, in Pliny only.
- *rānunculus* (buttercup): a medicinal plant in Pliny, “perhaps crowfoot”; the botanists’ name for the buttercups.
- *vīburnum* (wayfaring tree): Lewis & Short’s identification, from one line of Vergil.
- *convolvulus* (bindweed): one place in Pliny; in Cato the word is a caterpillar.
- *caecilia* (slow-worm): “a kind of lizard” in Lewis & Short; the slow-worm is the usual identification.
- *viverra* (ferret): the ferret in Pliny; it also answers *polecat*, the ferret’s wild form, for which we found no name of its own.
- *oniscus, multipeda, millepeda, centipeda* (woodlouse, centipede): the ancient names run into one another; Lewis & Short glosses *millepeda* as millipede, woodlouse and a hairy caterpillar.
- *fulica* (coot): “a coot, a water-fowl”.
- *rhecoma* (rhubarb): “a root, perhaps rhubarb”, in Pliny.
- *speculāria* (greenhouse): window panes, and in Pliny and Columella the glazed frames behind which plants were kept in winter; not a building.
- *terricula* (scarecrow): Lewis & Short gives “scarecrow, bugbear”, but Livy’s two places are of empty threats; *formīdō* is what Horace’s garden Priapus calls himself.
- Vowel lengths: *roscidus* is left with its first vowel unmarked, as Lewis & Short and de Vaan leave it; *sorex* and *veprēs* have vowels Lewis & Short gives as common, left unmarked; *ēsculentus* is written with the long vowel of *ēsca*, which Lewis & Short does not mark; *ribes* and *rheubarbarum* are written without marks, as Morgan–Owens writes them; Morgan–Owens writes *rhēcoma* where Lewis & Short, followed here, leaves the vowel unmarked.

## Modern names

Two things have no ancient name that we found: the jay (*garrulus*, the zoologists’ name, Brisson 1760; Linnaeus’s *Corvus glandarius*, 1758) and the dragonfly (*lībellula*, Linnaeus 1758). Both are marked modern. *pārus* (tit) is late Latin, from one poem. Nothing in this round is marked as ours.

Round three: the foxglove is *digitālis purpurea*, the botanists’ name, from Morgan–Owens s.v. flowers: foxglove (which cites Grosse 1846). The tulip is *tulipa* (Morgan–Owens s.v. flowers: tulip, from Noël) and the gooseberry *grossulāria* (Morgan–Owens s.v. berry: currant: gooseberry, from Linnaeus), both modern. The currant is *ribes*, medieval (Morgan–Owens s.v. berry: currant, with a fourteenth-century source in Latham and the OED, and Mattioli 1571 for the declension); the rhubarb is Isidore’s *rheubarbarum* (late), through Morgan–Owens s.v. rhubarb. Nothing in this round is marked as ours either.

## The words left without an answer (15 November 2026)

A short fourth pass over the list “From the walk, no entry yet”, after Jack’s remark that stump, anthill and petal are common words and each deserves an honest entry. Fifteen new records and changes to seven. Pliny was read in Mayhoff’s text in the Perseus Digital Library (the loci collections do not have these passages), and the records that quote it say so.

| English | Latin | On what evidence |
| --- | --- | --- |
| stump | *stirps*; beside it *truncus*, *caudex (cōdex)*, *stīpes* | Lewis & Short: “the lower part of the trunk of plants, including the roots; a stock”; Verg. A. 12.208 *īmō dē stirpe recīsum*; Cato Agr. 161.3 and Liv. 21.36.1 from the loci. The other three name the trunk, a block or a log. |
| petal | *folium*; *petalum* as the botanists’ word | Plin. NH 21.16–17 counts the *folia* of the rose and names the *centifolia*. *petalum* of a flower is of the seventeenth century (Morgan–Owens, from the OED). Lewis & Short’s article *folium* does not mention the use. |
| anthill | *formīcārum cavernae* | Plin. NH 28.86 *ad cavernās formīcārum*; NH 11.111 has the ants *in cunīculōs*. No word for the heap itself was found. |
| service tree | *sorbus*, *sorbum* | Lewis & Short; Plin. NH 16.74. |
| burdock | *persōnāta*; *lappa* | Lewis & Short (“a kind of large burdock”); Plin. NH 25.104 describes it: the broadest of leaves, large burs. `bur` no longer answers “burdock”. |
| nightshade | *sōlānum*; *strychnos* | Lewis & Short (Pliny, Celsus). |
| plantain | *plantāgō* | Lewis & Short; Plin. NH 25.80. |
| vetch | *vicia* | Lewis & Short (Cato, Varro, Vergil). |
| tree frog | *calamītēs* | Plin. NH 32.122: the smallest and greenest frog, living among reeds and bushes. Lewis & Short says “the green frog”; that it is the tree frog rests on the description. |
| plateau | *plānitiēs excelsa*; *oropedium* | Morgan–Owens (Humboldt; Egger). *plānitiēs* among mountains is in Sall. Cat. 59.2. |
| roost | *stabulor* | Lewis & Short (“to stable, kennel, harbor, roost”); Varr. RR 3.3.7. |
| pounce | *involō* | Lewis & Short (“to fly at, rush upon”). |
| soar | *subvolō* | Lewis & Short (“to fly up or upwards”). |
| swoop | *dēvolō* | Lewis & Short (“to fly down”). |
| thin out | *interlūcō*; *disrārō* | Lewis & Short; Plin. NH 17.94, 17.214; Columella. |
| dogwood | added to the “also” words of `cornelian-cherry-tree` (*cornus*) | Lewis & Short has only the cornelian cherry; the comment says dogwood is entered there as the nearest tree. Plin. NH 16.74 has *sanguineī fruticēs* among the hill trees, which may be the dogwood; no reference work here says so. |
| midge | added to `gnat` (*culex*) | Lewis & Short: “a gnat, midge”. |
| polecat | *fēlēs* added to `ferret` | Lewis & Short: in Varro and Columella “a marten, ferret, polecat”. |
| foothill | added to `foot-of-a-mountain` (*rādīx montis*) | already answered there. |
| hollow (in the ground) | *lacūna* added to `hollow` | Lewis & Short: “a ditch, pit, hole”. |
| prickle | *acūleus* added to `thorn` | Lewis & Short: “of plants, a spine or prickle” (Pliny). |

Not answered, and why:

- **aspen, primrose, cowslip, snowdrop, bluebell, bumblebee, wildcat.** Lewis & Short, Traupman and Morgan–Owens have no word, and the botanical or zoological name could not be given with a source: none of the reference works here has it, and the usual sites were closed to this session. The names to check are *Populus tremula*, *Primula vulgaris*, *Primula veris*, *Galanthus nivalis*, *Hyacinthoides non-scripta*, *Bombus*, *Felis silvestris*. Pliny’s third poplar, *quae Libyca appellatur, minima foliō ac nigerrima* (NH 16.85), is sometimes taken for the aspen; nothing here confirms it.
- **forget-me-not.** Lewis & Short has *myosōta, myosōtis*, “mouse-ear, a plant” (Plin. NH 27.105). That the botanists gave this name to the forget-me-nots is not in any reference work here, so it was not entered.
- **rowan.** It stays under *ornus* in `manna-ash`; *sorbus* is now in as the service tree, and no ancient name for the rowan itself was found.
- **stag beetle.** Plin. NH 11.97 describes it (a large beetle with long forked horns) and gives Nigidius’s name for it; Mayhoff prints *lucavos*, other editions *lucanos*, whence the zoologists’ *Lucanus*. Lewis & Short has neither form, so the quantities are unknown and the word was not entered.
- **scree, heath as a place.** No word found. Lewis & Short has *erīcē* only for the plant.
- **burrow, peck, prowl.** No clear verb: *cunīculus* is the burrow (and Pliny has ants *in cunīculōs*), *vellicō* is to pluck or nip (*cornīx vulturiōs vellicat*, Plaut.), *grassor* is to go about; none is glossed with the English word.
- **mulch, secateurs.** Nothing in the three reference works; `sickle` (*falx*) still answers “secateurs” and “pruning knife”.

## The botanical and zoological names (15 November 2026)

The names the last pass could not source were entered, one term each, as `modern`, each from a page that states the name: seven plants from Rob Wilson’s *Flora Checklist of Northamptonshire & The Soke of Peterborough* (2014, on the BSBI’s website), which prints the name, its author and the English name; the wildcat from the Mammal Diversity Database; the bumblebee from the New World Encyclopedia; the stag beetle from Wikipedia’s article (read in a Kiwix copy), which gives Linnaeus and 1758 for the species under its first name, *Scarabaeus cervus*. Vowel lengths are marked only on the words Lewis & Short has; each comment says which are left unmarked.

| English | Name | Source |
| --- | --- | --- |
| aspen | *pōpulus tremula* (L.) | Wilson |
| rowan | *sorbus aucuparia* (L.) | Wilson; `manna-ash` no longer answers “rowan” |
| primrose | *primula vulgāris* (Huds.) | Wilson |
| cowslip | *primula vēris* (L.) | Wilson |
| snowdrop | *galanthus nivālis* (L.) | Wilson |
| bluebell | *hyacinthoides nōn-scrīpta* ((L.) Chouard ex Rothm.) | Wilson |
| forget-me-not | *myosōtis* (the genus; Wilson has *Myosotis arvensis* (L.) Hill, field forget-me-not) | Wilson; the word is Pliny’s (Lewis & Short) |
| wildcat | *fēlēs silvestris* (von Schreber, 1777) | Mammal Diversity Database |
| stag beetle | *lucanus cervus* | Wikipedia |
| bumblebee | *bombus* (Latreille, 1802) | New World Encyclopedia |

## Left for a later round

After round three.

**From the walk, still no entry.** Toadstools by kind; a polecat distinct from the ferret; scree, heath as a place; mulch, secateurs as a tool of their own, medlar, marigold; a greenhouse as a building; the verbs burrow, peck, prowl. The reasons are in the section “The words left without an answer” above.

**From the authors, read and not entered (57).** With the number of times the outdoor works have each: marmor (28), lympha (22), favilla (17), armus (17), lotos (10), colubra (10), suboles (9), bipennis (9), rastri (8), casia (8), verbena (7), thyrsus (7), temo (7), fluentum (7), cytisus (7), oleaster (6), ocinum (6), myrice (6), ervum (6), petra (5), mergus (5), aesculus (5), veratrum (4), stiva (3), tribulus (2), tinus (2), palear (2), nubecula (2), hibiscum (2), baccar (2), vulturius (1), vulpecula (1), thymbra (1), spelaeum (1), sisymbrium (1), siler (1), scilla (1), scatebra (1), scapus (1), saliunca (1), parra (1), paliurus (1), oscen (1), onager (1), oestrus (1), merops (1), melisphyllum (1), gelicidium (1), filicula (1), dentale (1), cupressetum (1), cerintha (1), caprificus (1), attagen (1), aesculetum (1), acalanthis (1), abrotonum (1). Most are the poets’ plants and birds, parts of the plough, or words of the verse only.

**Adjectives and verbs not yet entered.** To perch or roost (the record for a bird settling has *īnsīdō*), to burrow, peck, prowl, pounce, soar and swoop; the adjectives of material (*fāgineus, ulmeus, fraxineus, saxeus*) and *silvāticus, nemorālis, herbidus*. General words left to the sweep in rank order: *cavus, āridus, fēcundus, arvum, pābulum, jūmentum*.

**Not read at all:** the farm words of Cato beyond the garden (the press, the vats, the measures).
