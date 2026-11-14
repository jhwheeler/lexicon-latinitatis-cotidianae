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

## Modern names

Two things have no ancient name that we found: the jay (*garrulus*, the zoologists’ name, Brisson 1760; Linnaeus’s *Corvus glandarius*, 1758) and the dragonfly (*lībellula*, Linnaeus 1758). Both are marked modern. *pārus* (tit) is late Latin, from one poem. Nothing in this round is marked as ours.

## Left for a later round

**From the walk, no entry yet.** Trees and plants: aspen, rowan, holly, cedar, privet, dogwood, honeysuckle, burdock as a plant of its own, primrose, snowdrop, nightshade, foxglove, buttercup, plantain, vetch, toadstools by kind. Parts: catkin (*iūlus*, Pliny), prickle, stump, petal. Animals: polecat, shrew (*sorex*), wildcat, slow-worm (*caecilia* is “a kind of lizard” in Lewis & Short), tree frog, stag beetle, bumblebee, midge, centipede, woodlouse; anthill, claw. Land: scree, plateau, foothill, heath as a place, hollow. Garden: greenhouse, trellis, mulch, scarecrow, secateurs as a tool of their own, to uproot, to thin out, currant, gooseberry, medlar, rhubarb, tulip, marigold.

**From the authors, read and not entered (86).** With the number of times the outdoor works have each: taeda (39), vellus (37), vomer (31), marmor (28), lympha (22), scrobis (19), favilla (17), armus (17), pumex (12), villus (11), propago (11), lotos (10), colubra (10), suboles (9), fiscina (9), culmus (9), bipennis (9), rastri (8), casia (8), calathus (8), verbena (7), thyrsus (7), temo (7), sarmentum (7), fluentum (7), fiscella (7), cytisus (7), cedrus (7), arbutus (7), tinea (6), oleaster (6), ocinum (6), myrice (6), ervum (6), petra (5), mergus (5), cos (5), aesculus (5), veratrum (4), ruta (4), stiva (3), tribulus (2), tinus (2), suber (2), palear (2), nubecula (2), hibiscum (2), fulica (2), baccar (2), vulturius (1), vulpecula (1), volutabrum (1), virectum (1), viburnum (1), thymbra (1), spinetum (1), spelaeum (1), sorex (1), sisymbrium (1), siler (1), scilla (1), scatebra (1), scapus (1), saliunca (1), ramale (1), parra (1), paliurus (1), oscen (1), onager (1), oestrus (1), merops (1), melisphyllum (1), ligustrum (1), gelicidium (1), filicula (1), dentale (1), cupressetum (1), coryletum (1), cerintha (1), carectum (1), caprificus (1), attagen (1), aesculetum (1), acinus (1), acalanthis (1), abrotonum (1).

Not read at all: the adjectives and verbs of the same lists (*frondeō, virēscō, silvestris, palūster, saxōsus* …), and the farm words of Cato beyond the garden (the press, the vats, the measures).
