#!/usr/bin/env python3
"""Measure how much of a frequency list of Latin lemmas the lexicon covers.

The Latin counterpart of coverage.py. A lemma of the list (refs/latin-frequency.tsv, made by
latin_frequency.py) is covered when it is the head of a one-word term of some record: the word
that has a page in l/ ("caccabus" in "caccabus (cacabus), caccabī m."), or the other form such a
term gives in brackets (cacabus; ac in "atque (ac)"). A term marked "avoid" does not count: a
word the lexicon only warns against is not entered in its own sense.

Both sides are compared as the site's search compares them: lower case, without macrons, j as i
and v as u. The list follows its corpus, which writes verbs under the first person, deponents in
-or and adjectives under the masculine, as the lexicon does. Where the two differ, in this order:

1. another spelling: an assimilated prefix (adfero, affero; conloco, colloco), uo for uu (uolgus),
   -umus for -imus, and the pairs in SPELLINGS (quatuor, quattuor), and the corpus's own lemmas in
   ALIASES (ab for the lexicon's ā, sui for its sē);
2. the other voice: a verb the list has as a deponent and the lexicon as active, or the reverse
   (mereor, mereō);
3. the plural: a word the list has in the singular and the lexicon heads with its plural (paucus,
   paucī; ops, opēs);
4. the adjective as a noun: the corpus files honestum, pūblicum, propinquī and armātī as nouns
   apart from their adjectives; where Lewis & Short has no such headword and the lexicon has the
   adjective, the lexicon has the word;
5. homographs: when the list gives a declension or conjugation and every lexicon term spelt like
   the lemma belongs to another (dico, first conjugation, beside the lexicon's dīcō, dīcere), the
   lemma is not covered and is reported apart, since it is another word.

A lemma that is not the head of any term but stands, in some form, inside a longer one (pūblicus
in rēs pūblica) is missing, and is marked with an asterisk in the report; the mark goes by the
word's beginning, so it is a hint and not a finding.

    python3 scripts/latin_coverage.py                                   # the numbers
    python3 scripts/latin_coverage.py --out notes/coverage/latin-frequency.md
    python3 scripts/latin_coverage.py --list other.tsv --top 2000
"""
import argparse
import json
import re
import sys
import unicodedata
from collections import namedtuple
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERM_HEAD = re.compile(r'^(.+?)(?=\s*(?:,|\(|$))')        # as in build.py
WORD = re.compile(r'[^\s;,.:()!?…+]+')
Head = namedtuple('Head', 'word latin status record cls')
Found = namedtuple('Found', 'status heads how')
Found.covered = property(lambda self: self.status in ('covered', 'spelling', 'voice', 'number', 'substantive'))


def fold(text):
    """As the search folds what is typed: lower case, no macrons, j as i, v as u."""
    text = unicodedata.normalize('NFD', text.lower()).replace('æ', 'ae').replace('œ', 'oe')
    return ''.join(c for c in text if not unicodedata.combining(c)).replace('j', 'i').replace('v', 'u').strip('-')


# The corpus's lemma → the lexicon's head, where the two name one word differently.
ALIASES = {'tanto': ['tantus'], 'quanto': ['quantus'], 'iure': ['ius'], 'nocte': ['nox'], 'posterius': ['posterus', 'postea'],
           'alternis': ['alternus'], 'nescioquis': ['nescio'], 'huiusmodi': ['modus'], 'utrumne': ['utrum'], 'ociter': ['ocius'],
           'propior': ['prope', 'proximus'], 'reuertor': ['reuerto'], 'percunctor': ['percontor'], 'luxuries': ['luxuria'],
           'nostri': ['noster'], 'uestri': ['uester'], 'tui': ['tuus'], 'mei': ['meus'], 'boni': ['bonus'], 'hercules': ['hercle', 'hercule', 'mehercule', 'mehercle'],
           'ab': ['a'], 'ex': ['e'], 'ac': ['atque'], 'nec': ['neque'], 'neque': ['nec'], 'sui': ['se'], 'nos': ['ego'],
           'uos': ['tu'], 'inquio': ['inquam'], 'coepio': ['coepi'], 'quatuor': ['quattuor'], 'necesse': ['necesse'],
           'plerusque': ['plerique'], 'ceterus': ['ceteri'], 'reliquum': ['reliquus'], 'nequeo': ['nequeo'],
           'tres': ['tres'], 'ambo': ['ambo'], 'complures': ['complures'], 'parum': ['parum', 'minus', 'minime']}
# Pairs of spellings, either of which a text or a dictionary may print.
SPELLINGS = [('numus', 'nummus'), ('brachium', 'bracchium'), ('teter', 'taeter'), ('bellua', 'belua'), ('pellex', 'paelex'),
             ('scena', 'scaena'), ('uillicus', 'uilicus'), ('uillica', 'uilica'), ('negligentia', 'neglegentia'),
             ('negligens', 'neglegens'), ('negligenter', 'neglegenter'), ('illico', 'ilico'), ('fenum', 'faenum'),
             ('formidolosus', 'formidulosus'), ('caenum', 'coenum'), ('connitor', 'conitor'), ('conniueo', 'coniueo'),
             ('connecto', 'conecto'), ('sollers', 'solers'), ('recupero', 'recipero'), ('recuperator', 'reciperator'),
             ('milliens', 'miliens'), ('milliens', 'milies'), ('miliens', 'milies'), ('quotidie', 'cotidie'), ('quotidianus', 'cotidianus'),
             ('lacryma', 'lacrima'), ('sylua', 'silua'), ('inclytus', 'inclutus'), ('inclitus', 'inclutus'), ('stylus', 'stilus'),
             ('satyra', 'satura'), ('ocior', 'ocius'), ('obedio', 'oboedio'), ('obscoenus', 'obscenus'), ('coeles', 'caeles'),
             ('coelestis', 'caelestis'), ('coeruleus', 'caeruleus'), ('moereo', 'maereo'), ('poenitet', 'paenitet'),
             ('quatuor', 'quattuor'), ('epistola', 'epistula'), ('littera', 'litera'), ('nequidquam', 'nequiquam'),
             ('quidquid', 'quicquid'), ('quidquam', 'quicquam'), ('tamquam', 'tanquam'), ('numquam', 'nunquam'),
             ('umquam', 'unquam'), ('quamquam', 'quanquam'), ('caelum', 'coelum'), ('cena', 'coena'), ('ceno', 'coeno'),
             ('femina', 'foemina'), ('lacrima', 'lacruma'), ('paulus', 'paullus'), ('paulum', 'paullum'),
             ('paulo', 'paullo'), ('paulatim', 'paullatim'), ('sollemnis', 'solemnis'), ('harena', 'arena'),
             ('cottidie', 'cotidie'), ('cottidianus', 'cotidianus'), ('religio', 'relligio'), ('conubium', 'connubium'),
             ('coniunx', 'coniux'), ('thesaurus', 'thensaurus'), ('uehemens', 'uemens'), ('nihil', 'nil'),
             ('prehendo', 'prendo'), ('deprehendo', 'deprendo'), ('comprehendo', 'comprendo'), ('saeculum', 'saeclum'),
             ('periculum', 'periclum'), ('uinculum', 'uinclum'), ('dexter', 'dextera'), ('dextera', 'dextra'),
             ('balneum', 'balineum'), ('caerimonia', 'caeremonia'), ('condicio', 'conditio'), ('nuntius', 'nuncius'),
             ('nuntio', 'nuncio'), ('contio', 'concio'), ('auctor', 'autor'), ('auctoritas', 'autoritas'),
             ('obscenus', 'obscaenus'), ('paenitet', 'poenitet'), ('paeniteo', 'paenitet'), ('proelium', 'praelium'),
             ('maereo', 'moereo'), ('maeror', 'moeror'), ('maestus', 'moestus'), ('faenus', 'fenus'), ('fetus', 'foetus'),
             ('fecundus', 'foecundus'), ('felix', 'foelix'), ('heres', 'haeres'), ('sepulcrum', 'sepulchrum'),
             ('pulcher', 'pulcer'), ('lacrimo', 'lacrumo'), ('monumentum', 'monimentum'), ('aduluscens', 'adulescens'),
             ('adolescens', 'adulescens'), ('adolescentia', 'adulescentia'), ('adolescentulus', 'adulescentulus'),
             ('intellego', 'intelligo'), ('neglego', 'negligo'), ('benevolentia', 'beniuolentia'), ('beneficium', 'benificium'),
             ('exsilium', 'exilium'), ('exsul', 'exul'), ('exspecto', 'expecto'), ('exsisto', 'existo'), ('exstinguo', 'extinguo'),
             ('exsequor', 'exequor'), ('exstruo', 'extruo'), ('exsulto', 'exulto'), ('exsto', 'exto'), ('exsurgo', 'exurgo'),
             ('exsecror', 'execror'), ('exspiro', 'expiro'), ('exsanguis', 'exanguis'), ('exsolvo', 'exsoluo'),
             ('inicio', 'iniicio'), ('abicio', 'abiicio'), ('adicio', 'adiicio'), ('conicio', 'coniicio'), ('deicio', 'deiicio'),
             ('eicio', 'eiicio'), ('obicio', 'obiicio'), ('proicio', 'proiicio'), ('reicio', 'reiicio'), ('subicio', 'subiicio'),
             ('traicio', 'traiicio'), ('traicio', 'transicio'), ('circumicio', 'circumiicio'), ('intericio', 'interiicio'),
             ('trado', 'transdo'), ('traduco', 'transduco'), ('trano', 'transno'), ('querela', 'querella'),
             ('loquela', 'loquella'), ('sollicitudo', 'solicitudo'), ('sollicito', 'solicito'), ('sollicitus', 'solicitus'),
             ('litus', 'littus'), ('sucus', 'succus'), ('bucina', 'buccina'), ('mille', 'milia'), ('reperio', 'repperio'),
             ('retuli', 'rettuli'), ('umerus', 'humerus'), ('umor', 'humor'), ('umidus', 'humidus'), ('erus', 'herus'),
             ('era', 'hera'), ('holus', 'olus'), ('harundo', 'arundo'), ('haruspex', 'aruspex'), ('hedera', 'edera'),
             ('ahenus', 'aenus'), ('aheneus', 'aeneus'), ('incoho', 'inchoo'), ('pulcher', 'pulcer'), ('anulus', 'annulus'),
             ('cuppedia', 'cupedia'), ('iuppiter', 'iupiter'), ('quotiens', 'quoties'), ('totiens', 'toties'),
             ('deciens', 'decies'), ('uicesimus', 'uigesimus'), ('uicensimus', 'uicesimus'), ('formosus', 'formonsus'),
             ('tus', 'thus'), ('clipeus', 'clupeus'), ('clipeus', 'clypeus'), ('libet', 'lubet'), ('libido', 'lubido'),
             ('libens', 'lubens'), ('libenter', 'lubenter'), ('quom', 'cum'), ('quur', 'cur'), ('uertex', 'uortex'),
             ('uerto', 'uorto'), ('uersus', 'uorsus'), ('aduersus', 'aduorsus'), ('uester', 'uoster'), ('ueto', 'uoto'),
             ('dein', 'deinde'), ('proin', 'proinde'), ('exin', 'exinde'), ('neu', 'neue'), ('seu', 'siue'), ('ceu', 'ceu'),
             ('hau', 'haud'), ('haut', 'haud'), ('set', 'sed'), ('aput', 'apud'), ('at', 'ast'), ('nei', 'ni'),
             ('ei', 'hei'), ('em', 'hem'), ('ah', 'a'), ('uah', 'uaha'), ('heu', 'eheu'), ('o', 'oh'), ('pro', 'proh')]
PREFIXES = [('adc', 'acc'), ('adf', 'aff'), ('adg', 'agg'), ('adl', 'all'), ('adn', 'ann'), ('adp', 'app'), ('adr', 'arr'),
            ('ads', 'ass'), ('adt', 'att'), ('adsc', 'asc'), ('adsp', 'asp'), ('adst', 'ast'), ('adgn', 'agn'),
            ('conl', 'coll'), ('conm', 'comm'), ('conp', 'comp'), ('conr', 'corr'), ('conb', 'comb'),
            ('inl', 'ill'), ('inm', 'imm'), ('inp', 'imp'), ('inr', 'irr'), ('inb', 'imb'),
            ('obc', 'occ'), ('obf', 'off'), ('obp', 'opp'), ('obm', 'omm'),
            ('subc', 'succ'), ('subf', 'suff'), ('subg', 'sugg'), ('subm', 'summ'), ('subp', 'supp'), ('subr', 'surr'),
            ('exf', 'eff'), ('ecf', 'eff'), ('disf', 'diff'), ('perl', 'pell'), ('exs', 'ex'), ('trans', 'tra'),
            ('quam', 'quan'), ('circum', 'circu')]


def spellings(lemma):
    """The other ways a folded lemma may be spelt, nearest first, without the lemma itself."""
    out = list(ALIASES.get(lemma, []))
    for a, b in SPELLINGS:
        if lemma == a:
            out.append(b)
        elif lemma == b:
            out.append(a)
    for a, b in PREFIXES:
        for old, new in ((a, b), (b, a)):
            if lemma.startswith(old) and len(lemma) > len(old) + 1:
                out.append(new + lemma[len(old):])
    for old, new in (('uo', 'uu'), ('uu', 'uo')):                     # uolgus, uulgus; seruos, seruus
        if old in lemma:
            out.append(lemma.replace(old, new))
    for old, new in (('umus', 'imus'), ('imus', 'umus'), ('undus', 'endus'), ('os', 'us'), ('om', 'um')):
        if lemma.endswith(old) and len(lemma) > len(old) + 2:
            out.append(lemma[:-len(old)] + new)
    return [s for s in dict.fromkeys(out) if s != lemma]


def other_voice(lemma):
    """loquor for loquo and mereo for mereor: the same verb as the other side may enter it."""
    if lemma.endswith('or') and len(lemma) > 3:
        return lemma[:-2] + 'o'
    if lemma.endswith('o') and len(lemma) > 2:
        return lemma + 'r'
    return None


# One word with forms of two declensions or conjugations (vās, vāsis, plural vāsa, vāsōrum; lavō, lavāre and lavere), or
# one the corpus files under two parts of speech (satis, multum).
ONE_WORD = {'uas', 'lauo', 'satis', 'multum'}
INFINITIVES = (('ārī', '1'), ('ērī', '2'), ('īrī', '4'), ('āre', '1'), ('ēre', '2'), ('īre', '4'), ('ere', '3'), ('ī', '3'))
GENITIVES = (('ārum', '1'), ('ōrum', '2'), ('uum', '4'), ('ērum', '5'), ('ae', '1'), ('ēī', '5'), ('eī', '5'), ('ūs', '4'),
             ('is', '3'), ('ium', '3'), ('um', '3'), ('ī', '2'))
IRREGULAR = re.compile(r'^\w*(?:esse|posse|ferre|ferrī|velle|nōlle|mālle|fierī|isse)$')


def term_class(latin):
    """The declension or conjugation a term's dictionary form shows, as the frequency list codes
    it (A3 a noun of the third declension, B1 a verb of the first conjugation, B6 an irregular
    verb); nothing where the form does not show one."""
    parts = [p.strip() for p in re.sub(r'\([^)]*\)', '', latin).split(';')[0].split(',')]
    if len(parts) < 2 or ' ' in parts[0]:
        return ''
    second = parts[1].split()
    if not second:
        return ''
    head = fold(parts[0])
    if len(second) >= 2 and re.match(r'^[mfnc]\.', second[1]):
        for ending, cls in GENITIVES:
            if second[0].endswith(ending):
                if cls == '5' and not head.endswith('es'):          # deī, oleī: the second declension
                    cls = '2'
                return 'A' + cls
        return 'A'
    inf = second[0]
    if (head.endswith('o') or head.endswith('or') or head.endswith('m')) and len(second) == 1:
        if IRREGULAR.match(inf) or head.endswith('eo') and inf.endswith('īre'):     # eō and its compounds
            return 'B6'
        for ending, cls in INFINITIVES:
            if inf.endswith(ending):
                if cls == '3' and (head.endswith('io') or head.endswith('ior')):
                    return 'B5'
                return 'B' + cls
    return ''


def same_class(theirs, ours, word=''):
    """Whether the list's class and a term's may be one word's: unknown on either side passes,
    a noun is never a verb, a word that is not inflected (X) is neither, the capiō kind (5) goes with the third conjugation, an irregular verb
    (6) or a Greek noun (7) with anything."""
    if not theirs or not ours or word in ONE_WORD:
        return True
    if 'X' in (theirs[0], ours[0]):                              # an adverb or particle is no noun or verb
        return theirs[0] == ours[0]
    if theirs[0] != ours[0]:
        return theirs[0] not in 'AB' or ours[0] not in 'AB'      # an adjective may be either's kin
    a, b = theirs[1:2], ours[1:2]
    if not a.isdigit() or not b.isdigit() or a == b or a in '67' or b in '67':
        return True
    return theirs[0] == 'B' and {a, b} <= {'3', '5'}


def first_persons(infinitive):
    """The first persons a bare infinitive may belong to, folded: spīrō for spīrāre, experior for
    experīrī, trahō and trahiō for trahere (only one of which is a word)."""
    for ending, firsts in (('ārī', ['or']), ('ērī', ['eor']), ('īrī', ['ior']), ('āre', ['o']), ('ēre', ['eo']), ('īre', ['io']),
                           ('ere', ['o', 'io'])):
        if infinitive.endswith(ending) and len(infinitive) > len(ending) + 1:
            return [fold(infinitive[:-len(ending)]) + first for first in firsts]
    return []


def adjectives(noun):
    """The adjective a noun may be a form of: honestus for honestum, propinquus for propinqui,
    caelestis for caelestes, humanus for humana."""
    out = []
    for ending, others in (('um', ['us', 'er']), ('i', ['us', 'er']), ('a', ['us', 'um']), ('es', ['is', 'us', 's'])):
        if noun.endswith(ending) and len(noun) > len(ending) + 2:
            out += [noun[:-len(ending)] + other for other in others]
    return out


def singulars(latin):
    """The singular a corpus may file a plural head under, folded: paucus for "paucī, paucae,
    pauca", ops for "opēs, opum f. pl."."""
    parts = [fold(p.strip()) for p in re.sub(r'\([^)]*\)', '', latin).split(',')]
    head = parts[0]
    if ' ' in head or len(parts) < 2:
        return []
    if len(parts) == 3 and head.endswith('i') and parts[1].endswith('ae') and parts[2].endswith('a'):
        return [head[:-1] + 'us']
    if not re.search(r'\bpl\.', latin):
        return []
    genitive = parts[1].split()[0]
    for plural, gen, endings in (('ae', 'arum', ['a']), ('i', 'orum', ['us', 'er']), ('a', 'orum', ['um']),
                                 ('es', 'ium', ['is', 'es', 's']), ('es', 'um', ['s', 'is', 'es', '']),
                                 ('ia', 'ium', ['e', 'al', 'ar']), ('a', 'um', ['us', 'en', ''])):
        if head.endswith(plural) and genitive.endswith(gen):
            stem = head[:-len(plural)]
            return [stem + ending for ending in endings] + ([stem[:-1] + 'x'] if stem[-1:] in ('c', 'g') else [])     # prex, precēs
    return []


UNINFLECTED = ('adverb', 'preposition', 'conjunction', 'interjection', 'particle')


def uninflected(record, term):
    """Whether a term given as a bare word is an adverb, a preposition or the like, by its own
    grammar line or else by the record's part of speech."""
    grammar = term.get('grammar', '')
    if grammar:
        return grammar.startswith(UNINFLECTED)
    pos = record.get('pos', '')
    return bool(pos) and isinstance(pos, str) and pos in UNINFLECTED


class Lexicon:
    """The one-word heads of the records' terms, folded, and the words that stand inside longer
    terms, with their beginnings (stems), by which a lemma is recognised in one of its forms."""

    def __init__(self, root=ROOT, records=None):
        self.heads, self.inside, self.plural = {}, set(), {}
        self.dictionary = dictionary_spelling(root)
        if records is None:
            records = [json.loads(path.read_text(encoding='utf-8')) for path in sorted((root / 'data/concepts').glob('*.json'))]
        for record in records:
            for term in record['terms']:
                latin = term['latin']
                head = TERM_HEAD.match(latin).group(1)
                if ' ' in head:
                    self.inside.update(fold(word) for word in WORD.findall(head))
                    continue
                words = [head]
                cls = term_class(latin)
                if not cls and ',' not in latin and uninflected(record, term):
                    cls = 'X'
                variant = re.match(r'^\S+ \(([^\s()+]+)\)', latin)            # caccabus (cacabus); atque (ac)
                if variant:
                    words.append(variant.group(1))
                pair = re.match(r'^(\S+), (\S+) (?:\(?\+|\()', latin)            # ā, ab (+ ablative); ex, ē + abl.
                if pair and not term_class(latin):
                    words.append(pair.group(2))
                if ',' not in latin and not cls:
                    for key in first_persons(head):                              # a verb given by its infinitive
                        self.heads.setdefault(key, []).append(Head(head, latin, term['status'], record['id'], 'B'))
                for word in words:
                    key = fold(word.strip('.!?'))
                    if key:
                        self.heads.setdefault(key, []).append(Head(word, latin, term['status'], record['id'], cls))
                for key in singulars(latin):
                    self.plural.setdefault(key, []).append(Head(head, latin, term['status'], record['id'], cls))

        self.stems = {word[:n] for word in self.inside for n in range(3, len(word) + 1)}

    def live(self, key, table=None):
        return [head for head in (self.heads if table is None else table).get(key, []) if head.status != 'avoid']


def find(lemma, cls, lexicon, part=''):
    """How the lexicon has a lemma of the list: Found(status, heads, how). status is "covered",
    "spelling" (under another spelling, named in how), "voice" (as the verb of the other voice),
    "number" (the lexicon's head is the plural), "substantive" (the corpus's noun is the lexicon's
    adjective), "homograph" (only words of another declension or conjugation are spelt so), "avoid" (only a
    term marked avoid) or "missing"."""
    key = fold(lemma)
    if part in UNINFLECTED:
        cls = 'X'
    conflict = None
    for candidate in ALIASES.get(key, []):                   # the corpus's own lemmas: a case form filed as an adverb
        heads = lexicon.live(candidate)
        if heads:
            return Found('covered' if candidate == key else 'spelling', heads, '' if candidate == key else heads[0].word)
    for status, candidates in (('covered', [key]), ('spelling', spellings(key)),
                               ('voice', [other_voice(key)] if cls[:1] == 'B' and other_voice(key) else [])):
        for candidate in candidates:
            heads = lexicon.live(candidate)
            fitting = [head for head in heads if same_class(cls, head.cls, candidate)]
            if fitting:
                return Found(status, fitting, '' if status == 'covered' else fitting[0].word)
            if heads and conflict is None and status == 'covered':
                conflict = heads
    for candidate in [key] + spellings(key):                # the lexicon's head is the plural: paucī, opēs
        heads = lexicon.live(candidate, lexicon.plural)
        if heads:
            return Found('number', heads, heads[0].word)
    if cls[:1] == 'A' and lexicon.dictionary and key not in lexicon.dictionary:
        for candidate in adjectives(key):                    # honestum, propinquī: the adjective as a noun
            heads = [head for head in lexicon.live(candidate) if not head.cls.startswith('B')]
            if heads:
                return Found('substantive', heads, heads[0].word)
    if conflict:
        return Found('homograph', conflict, ', '.join(dict.fromkeys(head.latin for head in conflict)))
    avoided = [head for head in lexicon.heads.get(key, []) if head.status == 'avoid']
    if avoided:
        return Found('avoid', avoided, '')
    stem = key[:-2] if len(key) > 4 else key[:-1] if len(key) > 3 else key
    return Found('missing', [], '*' if stem in lexicon.stems else '')


def load_list(path, top=None):
    """The rows of a frequency list: dicts with rank, lemma, count, part, class, works, link, forms."""
    rows = []
    names = ('rank', 'lemma', 'count', 'part', 'class', 'works', 'link', 'forms')
    for line in path.read_text(encoding='utf-8').splitlines():
        cells = line.split('\t')
        if line.startswith('#') or not cells[0].isdigit():
            continue
        row = dict(zip(names, cells + [''] * (len(names) - len(cells))))
        row['rank'], row['count'] = int(row['rank']), int(row['count'])
        rows.append(row)
    return rows[:top] if top else rows


def dictionary_spelling(root=ROOT):
    """{folded lemma: the word as Lewis & Short's keys spell it, with v and j}, for showing a
    missing lemma as a dictionary prints it (uulnus as vulnus)."""
    table = {}
    path = root / 'refs/lewis-short-headwords.tsv'
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            if line and not line.startswith('#'):
                key = line.split('\t')[0]
                if key == key.lower():
                    table.setdefault(fold(key), key)
    return table


def measure(rows, lexicon):
    return [(row, find(row['lemma'], row['class'], lexicon, row['part'])) for row in rows]


def report(results, list_name, checked=''):
    spelt = dictionary_spelling()
    show = lambda row: spelt.get(fold(row['lemma']), row['lemma'])
    bands = [n for n in (1000, 2000, 5000) if n <= len(results)] or [len(results)]
    if bands[-1] != len(results):
        bands.append(len(results))
    lines = [f'# Coverage of {list_name}', '',
             'How many of the most frequent lemmas of classical Latin are the head of a term in the lexicon. Generated by '
             '`scripts/latin_coverage.py` from the frequency list `scripts/latin_frequency.py` makes of the LASLA corpus '
             '(about 1.75 million words, Plautus to Tacitus; see `refs/README.md`). A lemma counts as covered when a record '
             'has it as the head of a one-word term that is recommended or an alternative; the comparison ignores macrons '
             'and reads j as i and v as u, as the site\'s search does.', '',
             '| The first | Covered | of which under another spelling | as the other voice | under the plural | under the adjective | Another word spelt alike | Only as a term to avoid | Missing |',
             '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |']
    for n in bands:
        part = results[:n]
        count = lambda *statuses: sum(1 for _, found in part if found.status in statuses)
        covered = count('covered', 'spelling', 'voice', 'number', 'substantive')
        lines.append(f'| {n:,} | {covered:,} ({100 * covered / n:.0f}%) | {count("spelling")} | {count("voice")} | {count("number")} | {count("substantive")} | {count("homograph")} | '
                     f'{count("avoid")} | {count("missing"):,} |')
    lines.append('')
    if checked:
        lines += ['## How this was checked', '', checked, '']
    missing = [(row, found) for row, found in results if found.status == 'missing']
    lines += [f'## Missing: {len(missing):,}', '',
              'In rank order, each with its rank and the number of times the corpus has it. The spelling is Lewis & Short\'s '
              'where it has the word (v and j), otherwise the corpus\'s. A word marked * stands, in some form, inside a longer '
              'term of the lexicon (as *aes* does in *aes aliēnum*) but has no entry of its own; the mark goes by the '
              'beginning of the word, so it is a hint.', '']
    low = 1
    for high in bands:
        band = [f'{row["rank"]}. {show(row)}{found.how} ({row["count"]:,})' for row, found in missing if low <= row['rank'] <= high]
        if band:
            lines += [f'### Ranks {low:,}–{high:,}: {len(band):,} missing', '', ', '.join(band), '']
        low = high + 1
    homographs = [(row, found) for row, found in results if found.status == 'homograph']
    if homographs:
        lines += [f'## Another word spelt alike: {len(homographs)}', '',
                  'The lexicon has a word spelt like the lemma, but of another declension or conjugation, so it is another '
                  'word and this one is missing. The corpus\'s commonest forms tell which word is meant.', '']
        lines += [f'- {row["rank"]}. {show(row)} ({row["count"]:,}; {row["part"]} {row["class"]}; forms: {row["forms"]}). The lexicon has: '
                  f'{found.how}.' for row, found in homographs] + ['']
    by_lemma = {}
    for row, found in results:
        by_lemma.setdefault(fold(row['lemma']), []).append((row, found))
    twins = []
    for key, group in by_lemma.items():
        have = {(head.word, head.cls[:1]) for row, found in group if found.status == 'covered' for head in found.heads}
        if len(group) > 1 and all(found.status == 'covered' for _, found in group) and len(have) < len(group):
            twins.append('- ' + '; '.join(f'{row["rank"]}. {show(row)} ({row["count"]:,}; {row["part"]} {row["class"]}; {row["forms"]})' for row, _ in group)
                         + '. The lexicon has: ' + ', '.join(sorted({head.latin for _, found in group for head in found.heads})) + '.')
    if twins:
        lines += [f'## To check by hand: {len(twins)} words the list has more than once', '',
                  'The corpus has two or more words spelt alike here (or one word under two parts of speech), all counted as '
                  'covered, while the lexicon heads fewer terms so spelt than the list has lines. Some are one word used two '
                  'ways (*ante* as adverb and preposition); in others the lexicon may lack one of the words (*ōs* beside *os*).', '']
        lines += twins + ['']
    avoided = [(row, found) for row, found in results if found.status == 'avoid']
    if avoided:
        lines += [f'## Only as a term to avoid: {len(avoided)}', '',
                  ', '.join(f'{row["rank"]}. {show(row)} ({row["count"]:,}; in {", ".join(sorted({h.record for h in found.heads}))})'
                            for row, found in avoided), '']
    for status, title, text in (('spelling', 'Covered under another spelling', 'The lemma as the corpus has it, and the lexicon\'s head.'),
                                ('voice', 'Covered as the verb of the other voice', 'The corpus\'s lemma and the lexicon\'s head.'),
                                ('number', 'Covered under the plural', 'The corpus\'s singular and the lexicon\'s plural head.'),
                                ('substantive', 'Covered under the adjective', 'The corpus\'s noun and the lexicon\'s adjective.')):
        found_so = [(row, found) for row, found in results if found.status == status]
        if found_so:
            lines += [f'## {title}: {len(found_so)}', '', text, '',
                      ', '.join(f'{row["lemma"]} → {found.how}' for row, found in found_so), '']
    lines += ['The list: derived from the LASLA corpus (Université de Liège) as published by the LiLa project (CIRCSE), '
              'https://github.com/CIRCSE/LASLA, CC BY-NC-SA 4.0.', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--list', type=Path, default=ROOT / 'refs/latin-frequency.tsv')
    parser.add_argument('--top', type=int, help='only the first so many lemmas')
    parser.add_argument('--out', type=Path, help='write the Markdown report here')
    parser.add_argument('--checked', type=Path, default=ROOT / 'notes/coverage/latin-frequency-check.md',
                        help='a file whose text goes under "How this was checked" (default notes/coverage/latin-frequency-check.md)')
    args = parser.parse_args()
    if not args.list.exists():
        sys.exit(f'{args.list} is missing: make it with scripts/latin_frequency.py')
    results = measure(load_list(args.list, args.top), Lexicon())
    for n in [n for n in (1000, 2000, 5000) if n <= len(results)] or [len(results)]:
        covered = sum(1 for _, found in results[:n] if found.covered)
        print(f'The first {n:,}: {covered:,} covered ({100 * covered / n:.0f}%), {n - covered:,} not.')
    if args.out:
        checked = args.checked.read_text(encoding='utf-8').strip() if args.checked and args.checked.exists() else ''
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(report(results, args.list.name, checked), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
