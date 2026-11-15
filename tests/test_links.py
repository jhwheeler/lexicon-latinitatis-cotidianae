"""Every Latin word linked: the index of forms, the choices it makes, and the pages. Run with
python3 -m unittest discover -s tests -v."""
import importlib.util
import re
import shutil
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
spec = importlib.util.spec_from_file_location('latin_unlinked', ROOT / 'scripts/latin_unlinked.py')
unlinked = importlib.util.module_from_spec(spec)
spec.loader.exec_module(unlinked)


class Anchors(HTMLParser):
    """The links of a page: (href, text), and whether every tag that opens is closed in order."""
    VOID = {'meta', 'link', 'br', 'input', 'img', 'hr'}

    def __init__(self):
        super().__init__()
        self.links, self.open, self.sound, self.href = [], [], True, None

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.open.append(tag)
        if tag == 'a':
            self.href, self.text = dict(attrs).get('href'), ''

    def handle_endtag(self, tag):
        if not self.open or self.open.pop() != tag:
            self.sound = False
        if tag == 'a':
            self.links.append((self.href, self.text))
            self.href = None

    def handle_data(self, data):
        if self.href is not None:
            self.text += data


def anchors(html):
    parser = Anchors()
    parser.feed(html)
    return parser


class LinkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.site = builder.load_site(ROOT)
        cls.forms = cls.site['forms']

    def head(self, word):
        return self.forms.resolve(word)[0]

    def test_inflected_forms_lead_to_their_words(self):
        for form, head in (('potest', 'possum'), ('Potest', 'possum'), ('exīre', 'exeō'), ('casā', 'casa'), ('piscīnam', 'piscīna'),
                           ('cucurrit', 'currō'), ('sunt', 'sum'), ('fuit', 'sum'), ('it', 'eō'), ('eunt', 'eō'), ('tulit', 'ferō'),
                           ('fert', 'ferō'), ('vult', 'volō'), ('māvult', 'mālō'), ('mihi', 'ego'), ('dedit', 'dō'), ('dabit', 'dō'),
                           ('locūtus', 'loquor'), ('amāvit', 'amō'), ('rūrī', 'rūs'), ('humī', 'humus')):
            self.assertEqual(self.head(form), head, form)

    def test_macrons_tell_words_apart(self):
        self.assertEqual(self.head('mālus'), 'mālus')
        self.assertEqual(self.head('malus'), 'malus')
        self.assertEqual(self.head('est'), 'sum')
        self.assertEqual(self.head('ēst'), 'edō')              # he eats
        self.assertEqual(self.head('is'), 'is')                # the pronoun; īs is "you go"
        self.assertEqual(self.head('īs'), 'eō')
        self.assertEqual(self.head('pedēs'), 'pēs')
        self.assertEqual(self.head('lēgit'), 'legō')
        self.assertEqual(self.head('rēgis'), 'rēx')
        self.assertEqual(self.head('regis'), 'regō')
        self.assertEqual(self.head('cūra'), 'cūra')            # the nominative is not the imperative cūrā
        # A word with the wrong macrons is not linked; without them it would be found.
        self.assertEqual(self.forms.resolve('piscinam'), (None, 'none'))
        self.assertIn('piscīna', self.forms.candidates('piscinam', marked=False))
        self.assertEqual(self.forms.resolve('piscinam', marked=False)[0], 'piscīna')

    def test_a_form_of_several_words_is_left_unlinked(self):
        for form, heads in (('canis', {'canis', 'canō'}), ('vīs', {'vīs', 'volō'}), ('amor', {'amor', 'amō'}), ('cūrā', {'cūra', 'cūrō'})):
            self.assertEqual(self.forms.resolve(form), (None, 'ambiguous'), form)
            self.assertEqual(set(self.forms.candidates(form)), heads, form)
        # eō is the verb's own dictionary form: the far commoner pronoun does not take it
        self.assertEqual(self.forms.resolve('eō'), (None, 'ambiguous'))
        self.assertIn('is', self.forms.candidates('eō'))

    def test_entries_that_are_the_same_word_are_no_ambiguity(self):
        for form, head in (('tacē', 'taceō'),          # not the one-word saying "Tacē."
                           ('illa', 'ille'), ('quid', 'quis'),   # entries made of a form
                           ('omnia', 'omnis'), ('mōrēs', 'mōs'), ('litterae', 'littera'),   # entries for a plural
                           ('nātūra', 'nātūra'),       # not a future participle
                           ('certē', 'certē'), ('minus', 'minus'),   # the adverb, which has an entry
                           ('ita', 'ita')):
            self.assertEqual(self.head(form), head, form)
        self.assertEqual(self.forms.resolve('līberīs'), (None, 'ambiguous'))   # the children are not "free"

    def test_the_commoner_word_is_chosen_only_when_far_commoner(self):
        self.assertEqual(self.head('erō'), 'sum')       # not the dative of erus
        self.assertEqual(self.head('quī'), 'quī')       # not the imperative of queō
        self.assertEqual(self.forms.resolve('lāta'), (None, 'ambiguous'))     # wide, or carried: frequency does not choose a participle
        self.assertEqual(self.forms.resolve('veniam'), (None, 'ambiguous'))   # venia, or veniō
        self.assertGreaterEqual(self.forms.count('sum')[0], builder.LINK_RATIO * self.forms.count('erus')[1])
        canis, cano = self.forms.count('canis'), self.forms.count('canō')
        self.assertLess(max(canis[0], cano[0]), builder.LINK_RATIO * min(canis[1], cano[1]))

    def test_without_the_frequency_list_nothing_is_chosen_by_frequency(self):
        with tempfile.TemporaryDirectory() as temp:
            forms = builder.FormIndex(self.site['records'], self.site['words'], Path(temp))
            self.assertEqual(forms.resolve('erō'), (None, 'ambiguous'))
            self.assertEqual(forms.resolve('potest')[0], 'possum')
            self.assertEqual(forms.resolve('tacē')[0], 'taceō')

    def test_enclitics_clipped_questions_and_early_spellings(self):
        self.assertEqual(self.head('virumque'), 'vir')
        self.assertEqual(self.head('potestne'), 'possum')
        self.assertEqual(self.head('quoque'), 'quoque')         # found as written, so nothing is taken off
        self.assertEqual(self.head('satin’'), 'satis')
        self.assertEqual(self.head("audīn'"), 'audiō')
        self.assertEqual(self.head('servos'), 'servus')         # the early nominative; servōs is the accusative
        self.assertEqual(self.head('voluit'), 'volō')           # u and v are kept apart: volvit is volvō's
        self.assertEqual(self.head('volvit'), 'volvō')
        self.assertEqual(self.head('ac'), 'atque')
        self.assertEqual(self.head('nec'), 'neque')

    def test_the_tables_agree_with_the_search(self):
        for cls, endings in builder._MARKED_LISTS.items():
            folded = {builder.fold(e) for e in endings}
            known = set(builder._LINK_ENDINGS[cls])
            self.assertLessEqual(folded, known, cls)
            if cls not in ('esse', 'ire'):      # of sum and eō only the short forms are marked
                self.assertEqual(folded, known, cls)
        for head, forms in builder._MARKED_IRREGULAR.items():
            self.assertEqual({builder.fold(f) for f in forms}, set(builder._IRREGULAR[head][0]), head)
        lower = {head.lower(): head for head in self.site['words']}
        for head, forms in builder.IRREGULAR_FORMS.items():
            head = head if head in self.site['words'] else lower.get(head)
            for form in forms.split() if head else ():
                self.assertIn(head, self.forms.candidates(form), form)
        self.assertNotIn('frūstror', self.forms.candidates('frūstrā'))     # a deponent has no active imperative

    def test_a_saying_is_told_from_a_dictionary_form(self):
        self.assertTrue(builder.is_saying('Quī tacet, cōnsentit.'))
        self.assertTrue(builder.is_saying('Potest ex casā vir magnus exīre.'))
        for latin in ('Rōma, Rōmae f.', 'casa, casae f.', 'ūnus ex (ē, dē) + abl.', 'vir magnus'):
            self.assertFalse(builder.is_saying(latin), latin)

    def test_the_words_of_a_text(self):
        words = [(w, state, head) for w, state, head in builder.latin_words('Canis «vīn’ īre» inquit Mārcō III Kal. M. Tulliō.', self.forms) if state]
        self.assertEqual(words[0], ('Canis', 'ambiguous', None))
        self.assertEqual(words[1][2], 'vīn’' if 'vīn’' in self.site['words'] else "vīn'")
        self.assertEqual(words[2], ('īre', 'linked', 'eō'))
        self.assertEqual(words[3], ('inquit', 'linked', 'inquam'))
        names = [w for w, state, _ in words if state == 'name']
        for name in ('Mārcō', 'Tulliō'):
            self.assertEqual(name in names, self.forms.resolve(name)[1] == 'none', name)
        self.assertNotIn('III', [w for w, _, _ in words])
        self.assertNotIn('M', [w for w, _, _ in words])
        text = 'Potest ex casā vir magnus exīre, potest et ex dēfōrmī corpusculō.'
        self.assertEqual(''.join(piece for piece, _, _ in builder.latin_words(text, self.forms)), text)

    def test_the_headline_of_a_saying_is_linked_word_by_word(self):
        record = self.site['records']['a-great-man-can-come-from-a-hovel']
        page = builder.render_concept_page(record, self.site, self.site['categories'])
        parsed = anchors(page)
        self.assertTrue(parsed.sound)
        slugs = {info['slug'] for info in self.site['words'].values()}
        headline = re.search(r'<p class="lemma" lang="la"><b>(.*?)</b>', page).group(1)
        linked = anchors(headline).links
        self.assertEqual([text for _, text in linked], ['Potest', 'ex', 'casā', 'vir', 'magnus', 'exīre'])
        self.assertEqual([href for href, _ in linked], [f'../l/{s}.html' for s in ('possum', 'ex', 'casa', 'vir', 'magnus', 'exeo')])
        for href, _ in parsed.links:
            if href.startswith('../l/'):
                self.assertIn(href[5:-5], slugs, href)

    def test_the_words_of_an_example_are_links_in_the_quiet_class(self):
        record = self.site['records']['hut']
        page = builder.render_concept_page(record, self.site, self.site['categories'])
        self.assertTrue(anchors(page).sound)
        examples = re.findall(r'<p class="la tap" lang="la">(.*?)</p>', page)
        self.assertEqual(len(examples), len(record['phrases']))
        self.assertNotIn('<p class="la" lang="la">', page)
        links = [link for example in examples for link in anchors(example).links]
        self.assertTrue(links)
        self.assertTrue(all(re.fullmatch(r'\.\./l/[a-z0-9-]+\.html', href) for href, _ in links))
        # The text is the example's own: nothing added, nothing lost.
        for example, phrase in zip(examples, record['phrases']):
            self.assertEqual(builder.plain(re.sub(r'<sup.*?</sup>', '', example)), builder.plain(builder.escape(phrase['latin'])))
        css = (ROOT / 'src/styles.css').read_text(encoding='utf-8')
        self.assertIn('.tap a { text-decoration-line:none; }', css)
        self.assertIn('.tap a:hover, .tap a:focus-visible { text-decoration-line:underline; }', css)

    def test_a_word_is_not_linked_to_the_page_it_is_on(self):
        info = self.site['words']['casa']
        page = builder.render_word_page('casa', info, self.site)
        parsed = anchors(page)
        self.assertTrue(parsed.sound)
        self.assertNotIn(f'{info["slug"]}.html', [href for href, _ in parsed.links])
        examples = re.findall(r'<p class="la tap" lang="la">(.*?)</p>', page)
        self.assertTrue(any(re.search(r'(?<![>\w])cas(?:a|ā|ae|am|ās|īs|ārum)\b', example) for example in examples), 'the word itself stands as plain text')
        self.assertTrue(any(anchors(example).links for example in examples), 'the other words are links')
        # A head of one word still leads to its own page from an entry.
        entry = builder.render_concept_page(self.site['records']['hut'], self.site, self.site['categories'])
        self.assertIn(f'<b><a href="../l/{info["slug"]}.html">casa</a></b>', entry)

    def test_the_totals_and_the_report(self):
        totals = builder.link_totals(self.site)
        self.assertGreater(totals['linked'], 0.8 * sum(totals.values()))
        self.assertRegex(builder.totals_line(totals), r'^Latin words in the texts: [\d,]+; linked [\d,]+ \(\d+\.\d%\), ambiguous')
        text, groups = unlinked.report(self.site)
        for heading in ('## Words without an entry', '## Forms not reached although the word has an entry',
                        '## Found only when the macrons are ignored', '## Proper names without an entry',
                        '## Forms left unlinked because they may belong to several words'):
            self.assertIn(heading, text)
        self.assertIn(f'| {totals["linked"]:,} (', text)
        self.assertNotIn('casa', groups['missing'])
        self.assertEqual(unlinked.likely_lemma('piscātōrem', {'piscator': 'piscātor'}), 'piscātor')
        self.assertEqual(unlinked.likely_lemma('īnspicere', {'inspicio': 'īnspiciō'}), 'īnspiciō')


class FamilyTests(unittest.TestCase):
    """Word families: the headwords made from one root, on the word's page and the concept's."""
    @classmethod
    def setUpClass(cls):
        cls.site = builder.load_site(ROOT)
        cls.families = cls.site['families']

    def family(self, head, concept=None):
        """The heads in the family of a word (of the one entered under a concept, if the head is several)."""
        found = [lexeme for lexeme in self.families.by_head[head] if concept is None or concept in lexeme.concepts()]
        self.assertEqual(len(found), 1, f'{head} is {len(found)} words')
        return [other.head for other in self.families.of(found[0])]

    def joined(self, one, other):
        return any(b in self.families.family.get(a, ()) for a in self.families.by_head[one] for b in self.families.by_head[other])

    def test_the_acrobat_leads_to_the_trampoline(self):
        self.assertEqual(self.family('petaurista'), ['petauristārius', 'petaurum'])
        self.assertEqual(sorted(self.family('petaurum')), ['petaurista', 'petauristārius'])
        words = self.site['words']
        page = builder.render_word_page('petaurista', words['petaurista'], self.site)
        line = re.search(r'<p class="see family">(.*?)</p>', page).group(1)
        self.assertIn('Same family:', line)
        self.assertIn(f'<a href="{words["petaurum"]["slug"]}.html" lang="la">petaurum</a> (trampoline)', line)
        self.assertIn(f'<a href="{words["petauristārius"]["slug"]}.html" lang="la">petauristārius</a> (acrobat)', line)
        self.assertTrue(anchors(page).sound)
        # The concept's page: the family of its answer, linked to the concepts where the words are
        # entered; a word entered only on this page is not repeated, and "See also" keeps its label.
        entry = builder.render_concept_page(self.site['records']['acrobat'], self.site, self.site['categories'])
        line = re.search(r'<p class="see family">(.*?)</p>', entry).group(1)
        self.assertEqual(line, '<span class="fam-label">Same family:</span> <span lang="la">petaurum</span> '
                               '(<a href="trampoline.html">trampoline</a>).')
        self.assertTrue(anchors(entry).sound)
        back = builder.render_concept_page(self.site['records']['trampoline'], self.site, self.site['categories'])
        self.assertIn('<span lang="la">petaurista</span> (<a href="acrobat.html">acrobat</a>)',
                      re.search(r'<p class="see family">(.*?)</p>', back).group(1))
        related = next(record for record in self.site['records'].values() if record.get('related'))
        self.assertIn('<p class="see">See also ', builder.render_concept_page(related, self.site, self.site['categories']))

    def test_look_alikes_are_not_joined(self):
        for one, other in (('malus', 'mālum'), ('malus', 'mālus'), ('os', 'ōs'), ('liber', 'līber'), ('populus', 'pōpulus'),
                           ('canis', 'canō'), ('canis', 'cānus'), ('canō', 'cānus'), ('aurum', 'auris'), ('aurum', 'aura'),
                           ('auris', 'aura'), ('cōmō', 'coma'), ('dīcō', 'dicō'), ('ferō', 'lātus'), ('calamitās', 'calamus'),
                           ('veniō', 'ventus'), ('aper', 'Aprīlis'), ('doleō', 'redoleō'), ('Crēta', 'crēta')):
            self.assertFalse(self.joined(one, other), f'{one} and {other}')
        # Vowel lengths decide: the people's adjective is not the poplar's, and the golden is gold's
        self.assertIn('populāris', self.family('populus'))
        self.assertNotIn('pōpulus', self.families.family or ())
        self.assertIn('aurum', self.family('aureus'))
        self.assertIn('auris', self.family('auricula'))
        # One head, two words: each has its own family, and neither is in the other's
        for head, a, b, mine, theirs in (('volō', 'fly', 'want', 'volātus', 'voluntās'), ('jūs', 'law', 'soup', 'jūrō', 'jūsculum'),
                                         ('mālus', 'apple-tree', 'mast', None, None)):
            one, other = self.family(head, a), self.family(head, b)
            self.assertNotIn(head, one + other, head)
            if mine:
                self.assertIn(mine, one)
                self.assertNotIn(theirs, one)
                self.assertIn(theirs, other)
                self.assertNotIn(mine, other)
        page = builder.render_word_page('volō', self.site['words']['volō'], self.site)
        self.assertEqual(len(re.findall(r'<p class="see family">', page)), 2)
        self.assertIn('Same family as <span lang="la">volō, velle, voluī</span>:', page)

    def test_a_compound_agrees_with_its_verb_in_both_stems(self):
        self.assertIn('faciō', self.family('cōnficiō'))        # cōnficiō, cōnfectum: faciō, factum
        self.assertIn('caedō', self.family('occīdō'))
        self.assertIn('emō', self.family('redimō'))
        self.assertFalse(self.joined('dēserō', 'serō'))        # dēsertum is not satum
        self.assertEqual(builder.weakenings('fac'), ['fac', 'fic', 'fec'])
        self.assertEqual(builder.weakenings('caed'), ['caed', 'cīd'])
        self.assertEqual(builder.weakenings('claud'), ['claud', 'clūd', 'clōd'])
        self.assertEqual(builder.weakenings('mitt'), ['mitt'])

    def test_a_phrase_has_no_family_and_a_word_is_not_in_its_own(self):
        families = self.families
        self.assertFalse(any(' ' in lexeme.head for lexeme in families.lexemes))
        record = self.site['records']['a-great-man-can-come-from-a-hovel']
        self.assertIsNone(families.of_term(record, record['terms'][0]))
        self.assertNotIn('class="see family"', builder.render_concept_page(record, self.site, self.site['categories']))
        for lexeme, family in families.family.items():
            self.assertIn(lexeme, family)
            self.assertNotIn(lexeme, families.of(lexeme))
            self.assertGreater(len(family), 1)
        # amīcus the noun and amīcus the adjective are one family: the page does not list itself
        info = self.site['words']['amīcus']
        page = builder.render_word_page('amīcus', info, self.site)
        line = re.search(r'<p class="see family">(.*?)</p>', page).group(1)
        self.assertIn('amīcitia', line)
        self.assertNotIn(f'href="{info["slug"]}.html"', line)
        self.assertNotIn('>amīcus<', line)
        # a word alone has no line
        alone = next(lexeme for lexeme in families.lexemes if lexeme not in families.family and len(families.by_head[lexeme.head]) == 1)
        self.assertEqual(families.of(alone), [])
        self.assertNotIn('class="see family"', builder.render_word_page(alone.head, self.site['words'][alone.head], self.site))

    def test_a_large_family_is_shortened_on_a_concepts_page(self):
        lexeme = next(l for l in self.families.lexemes if l.head == 'mittō')
        self.assertGreater(len(self.families.of(lexeme)), builder.FAMILY_SHOWN + 5)
        record = next(r for r, t in lexeme.uses if builder.ordered_terms(r)[0] is t)
        entry = builder.render_concept_page(record, self.site, self.site['categories'])
        line = re.search(r'<p class="see family">(.*?)</p>', entry).group(1)
        self.assertEqual(line.count('<span lang="la">'), builder.FAMILY_SHOWN)
        self.assertRegex(line, r', and \d+ more on the page of <a href="\.\./l/mitto\.html" lang="la">mittō</a>\.$')
        page = builder.render_word_page('mittō', self.site['words']['mittō'], self.site)
        self.assertEqual(page.count(' lang="la">', page.index('class="see family"'), page.index('</p>', page.index('class="see family"'))),
                         len({other.head for other in self.families.of(lexeme)}))

    def test_the_hand_kept_file_is_honoured(self):
        words, records = self.site['words'], self.site['records']
        bare = builder.Families(words, records, {})

        def joined(families, one, other):
            return any(b in families.family.get(a, ()) for a in families.by_head[one] for b in families.by_head[other])

        # apart: the method alone joins the reed to the disaster, and the wide to the carried
        self.assertTrue(joined(bare, 'calamitās', 'calamus'))
        self.assertTrue(joined(bare, 'lātus', 'ferō'))
        self.assertFalse(joined(self.families, 'calamitās', 'calamus'))
        # ... and words listed apart are not brought together through a third: petauristārius, which is
        # made from petaurista, stays out of the family rather than join petaurum by way of it
        kept = builder.Families(words, records, {'apart': [{'words': ['petaurum', 'petauristārius'], 'note': 'for the test'}]})
        self.assertTrue(joined(kept, 'petaurum', 'petaurista'))
        self.assertFalse(joined(kept, 'petaurum', 'petauristārius'))
        # together: the participle of absum, which the method cannot see
        self.assertFalse(joined(bare, 'absum', 'absēns'))
        self.assertTrue(joined(self.families, 'absum', 'absēns'))
        by_hand = builder.Families(words, records, {'together': [{'words': ['petaurum', 'calamus'], 'note': 'for the test'}]})
        self.assertTrue(joined(by_hand, 'petaurista', 'calamitās'))
        # homographs: jūs is one word by its forms, two by the file
        self.assertEqual(len(bare.by_head['jūs']), 1)
        self.assertEqual(len(self.families.by_head['jūs']), 2)
        # every entry of the repository's file has a note, and its words are words
        rules = builder.json.loads((ROOT / 'data/families.json').read_text(encoding='utf-8'))
        self.assertEqual(set(rules), {'version', 'apart', 'together', 'homographs'})
        for item in rules['apart'] + rules['together'] + rules['homographs']:
            self.assertTrue(item['note'].strip())

    def test_errors_in_the_hand_kept_file_are_refused(self):
        words, records = self.site['words'], self.site['records']
        for rules, message in (
                ({'apart': [{'words': ['calamitās', 'calamistrātus'], 'note': 'x'}]}, 'calamistrātus is not a word of the lexicon'),
                ({'together': [{'words': ['absum', 'nūllumverbum'], 'note': 'x'}]}, 'nūllumverbum is not a word of the lexicon'),
                ({'homographs': [{'word': 'jūsjūs', 'concepts': ['soup'], 'note': 'x'}]}, 'jūsjūs is not a word of the lexicon'),
                ({'homographs': [{'word': 'jūs', 'concepts': ['acrobat'], 'note': 'x'}]}, 'jūs is not a term of the concept acrobat'),
                ({'apart': [{'words': ['calamitās', 'calamus'], 'note': ' '}]}, 'no note of its authority'),
                ({'apart': [{'words': ['calamitās', 'calamus']}]}, 'Missing fields'),
                ({'apart': [{'words': ['calamitās'], 'note': 'x'}]}, 'takes two different words'),
                ({'together': [{'words': ['absum'], 'note': 'x'}]}, 'takes two words or more'),
                ({'apart': [{'words': ['volō', 'volātus'], 'note': 'x'}]}, 'volō is several words; say which by a concept'),
                ({'apart': [{'words': ['volō@acrobat', 'volātus'], 'note': 'x'}]}, 'volō is not a term of the concept acrobat'),
                ({'apart': [{'words': ['absum', 'absēns'], 'note': 'x'}], 'together': [{'words': ['absum', 'absēns'], 'note': 'x'}]},
                 'joins absum, absēns by hand, but lists two of them'),
                ({'near': []}, 'Unknown fields'),
                ({'version': 2}, 'Unsupported version')):
            with self.subTest(message), self.assertRaisesRegex(ValueError, message):
                builder.Families(words, records, rules)

    def test_the_builder_reads_the_file_and_refuses_a_bad_one(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for path in ('data', 'src'):
                shutil.copytree(ROOT / path, root / path)
            (root / 'data/families.json').write_text('{"version": 1, "apart": [{"words": ["calamitās", "nōnest"], "note": "x"}]}',
                                                     encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'data/families.json: nōnest is not a word of the lexicon'):
                builder.load_site(root)
            (root / 'data/families.json').unlink()         # without the file the method stands alone
            self.assertTrue(any(lexeme.head == 'calamus' for lexeme in next(
                family for lexeme, family in builder.load_site(root)['families'].family.items() if lexeme.head == 'calamitās')))

    def test_every_suffix_and_prefix_is_listed_once_and_documented(self):
        suffixes = [(kinds, suffix, classes) for kinds, suffix, classes in builder.FAMILY_SUFFIXES]
        self.assertEqual(len(suffixes), len(set(suffixes)))
        prefixes = [prefix for prefix, _ in builder.FAMILY_PREFIXES]
        self.assertEqual(len(prefixes), len(set(prefixes)))
        self.assertEqual(builder.FAMILY_MIN_ROOT, 3)
        text = (ROOT / 'docs/records.md').read_text(encoding='utf-8')
        for words in ('## Word families', 'data/families.json', 'A wrong family is worse than none'):
            self.assertTrue(words in text, f'docs/records.md does not say: {words}')


class LinkBuildTests(unittest.TestCase):
    """A site of its own: a term's head and an example are linked, and every link is good."""
    def test_a_built_site_has_good_links_in_heads_and_examples(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for path in ('data', 'src'):
                shutil.copytree(ROOT / path, root / path)
            outputs = builder.build_site(root)      # check_links runs inside
            page = outputs['c/a-great-man-can-come-from-a-hovel.html']
            self.assertIn('<a href="../l/possum.html">Potest</a>', page)
            self.assertIn('<a href="../l/exeo.html">exīre</a>', page)
            self.assertIn('l/possum.html', outputs)
            self.assertTrue(all(anchors(outputs[path]).sound for path in ('c/hut.html', 'l/casa.html', 'c/a-great-man-can-come-from-a-hovel.html')))
            self.assertEqual(builder.LINK_TOTALS, builder.link_totals(builder.load_site(root)))


if __name__ == '__main__':
    unittest.main()
