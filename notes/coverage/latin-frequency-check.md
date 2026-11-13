Checked on 13 November 2026, before the first batch of new records, when the report listed 1,573 lemmas of the 5,000 as not covered. This text is kept in `notes/coverage/latin-frequency-check.md` and copied into the report each time it is made.

- **A random sample of 60 "missing" lemmas** was looked up by hand in `data/concepts`: every term containing the word, and every head that begins like it. 58 had no one-word term. Two were false: *jūre*, a case form the corpus files as an adverb (the lexicon has *jūs*), and *exspīrō*, which the lexicon gives by its infinitive, *exspīrāre*. Both kinds are now matched (the aliases, and the rule for a bare infinitive). The sample was not drawn again afterwards.
- **A random sample of 40 "covered" lemmas** was read against the term that covers each: all 40 are the same word.
- **Every missing lemma was compared with the lexicon's heads one letter away** (445 near pairs read). This found the corpus's older spellings, which follow Forcellini: *numus, brachium, teter, bellua, pellex, scena, villicus, negligentia, illico, fenum, formidolosus, quatuor*. They are in the script's list of spellings.
- **The 80 missing lemmas that are not Lewis & Short headwords** were read. Most are nouns the corpus makes of adjectives (*honestum, pūblicum, propinquī, armātī*); those now count as covered where the lexicon has the adjective.
- **The 56 gaps among the first 1,000** were each looked at while the first batch was drafted. Five more had been false and were corrected by rule along the way: *ops, paucus, singulus* and *prex*, which the lexicon heads in the plural (*opēs, paucī, singulī, precēs*), and *bonum*.

What the check cannot see:

- Two words spelt alike and declined alike (*ōs*, a mouth, and *os*, a bone) are told apart only where the lexicon heads two terms; the section "To check by hand" lists the cases. The corpus's genders proved unreliable and are not used.
- The corpus files participles used as adjectives (*parātus, doctus*) and adverbs (*fortiter, acriter*) as lemmas of their own, as Lewis & Short often does not; they are counted here as words the lexicon should have.
- *resistō* (rank 886) is missing from the lexicon and also from the Perseus text of Lewis & Short that `scripts/lookup.py` reads, which has no article between *resistentia* and *resolūbilis*; it waits for another copy of the dictionary.
