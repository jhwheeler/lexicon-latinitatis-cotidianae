"""How the first clothing batch was converted (kept as a record and a pattern for later batches; it refuses to run twice).
Batch 1 of the clothing domain: cards entry-39, 58, 59, 60, 61 → concept records.
Every Latin form and phrase is checked to occur verbatim in its card before anything is written."""
import json, re, sys
from pathlib import Path
ROOT = Path(sys.argv[1])
cards = {e['id']: e for e in json.loads((ROOT / 'data/entries/vestitus.json').read_text(encoding='utf-8'))}
BATCH = ('entry-39', 'entry-58', 'entry-59', 'entry-60', 'entry-61')
html = {k: json.dumps(cards[k], ensure_ascii=False) for k in BATCH}
LS = {}
for k in BATCH:
    for block in cards[k]['blocks']:
        if block['type'] == 'sources':
            for para in block['paragraphs']:
                for link in para.split(' · '):
                    m = re.search(r'>Lewis &amp; Short: ([a-z]+)</a>$', link)
                    if m:
                        LS[m.group(1)] = link
MIR = '<a href="https://gikanenos.blogspot.com/" rel="noopener noreferrer" target="_blank">Mir: morning routine (transcription)</a>'
SILVA = '<a href="https://neolatinlexicon.org/silva-old/" rel="noopener noreferrer" target="_blank">Morgan–Owens: Silva</a>'
TRAUPMAN = 'John C. Traupman, <em>Conversational Latin for Oral Proficiency</em>, {pages}, checked against the searchable text of the book (29 October 2026).'
FABULAE = ('<span lang="la">Theodōrus et pater: Fābulae Latīnae ad vītam cotīdiānam</span> I–VII, as revised on 29 October 2026. '
           'Examples marked “Fābula” quote those texts word for word.')
COMPOSED = 'The example sentences marked “composed” are ours.'
FAB = {'II': 'Fābula II, <span lang="la">Sintra: castellum et puteus</span>', 'III': 'Fābula III, <span lang="la">Apud avum et aviam</span>',
       'VI': 'Fābula VI, <span lang="la">Reditus: per Alpēs domum</span>', 'VII': 'Fābula VII, <span lang="la">Diēs ūnus Osoitsae</span>'}
REVIEW = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}


def ls(*words):
    missing = [w for w in words if w not in LS]
    assert not missing, missing
    return ' · '.join(LS[w] for w in words)


def T(latin, status, period, gloss=None, evidence=None, comment=None, grammar=None):
    term = {'latin': latin, 'status': status, 'period': period}
    for key, value in (('grammar', grammar), ('gloss', gloss), ('evidence', evidence), ('comment', comment)):
        if value:
            term[key] = value
    return term


def P(latin, english, source='composed'):
    return {'latin': latin, 'english': english, 'source': source}


def R(id, english, pos, terms, sources, phrases=(), sense=None, also=(), related=(), replaces=()):
    record = {'id': id, 'english': english}
    if sense:
        record['sense'] = sense
    record['pos'] = pos
    if also:
        record['also'] = list(also)
    record['domain'] = 'vestitus'
    record['terms'] = terms
    if phrases:
        record['phrases'] = list(phrases)
    if related:
        record['related'] = list(related)
    record['sources'] = sources
    record['review'] = dict(REVIEW)
    if replaces:
        record['replaces'] = list(replaces)
    return record


records = [
    R('socks', 'socks', 'noun', [
        T('pedūlia, pedūlium n. pl.', 'recommended', 'modern', 'socks', ['Mir, morning routine'],
          'Socks in modern spoken Latin; Mir’s transcribed routine uses the word in this sense. The classical adjective is '
          '<strong lang="la">pedūlis, pedūle</strong>, “for the feet.”'),
        T('impilia, impilium n. pl.', 'alternative', 'classical', 'felt foot-coverings', ['Plin. NH 19.32 (Lewis &amp; Short)'],
          'Another modern choice for socks.'),
        T('ūdō, ūdōnis m.', 'alternative', 'classical', 'felt or fur sock', ['Mart. 14.140 (Lewis &amp; Short)'],
          'Ancient, and historically more specific. Plural <strong lang="la">ūdōnēs</strong>.'),
        T('fasciae pedūlēs', 'alternative', 'post-classical', 'foot-wraps', ['Dig. 34.2.26 (Lewis &amp; Short)']),
      ], [ls('pedulis', 'impilia', 'udo') + ' · ' + MIR + ' · ' + SILVA, COMPOSED],
      [P('Pedūlia indue.', 'Put your socks on.'), P('Pedūlia exue.', 'Take your socks off.')],
      also=('sock',), related=('stockings', 'shoe', 'entry-317'), replaces=('entry-39',)),
    R('stockings', 'stockings', 'noun', [
        T('tībiālia, tībiālium n. pl.', 'recommended', 'classical', 'leg coverings, gaiters or stockings', ['Suet. Aug. 82 (Lewis &amp; Short)']),
      ], [ls('tibialis')], also=('gaiters', 'leggings'), related=('socks', 'entry-317')),
    R('clothes', 'clothes', 'noun', [
        T('vestis, vestis f.', 'recommended', 'classical', 'garment; clothes'),
        T('vestīmentum, vestīmentī n.', 'alternative', 'classical', 'item of clothing'),
      ], [ls('vestimentum')], also=('clothing', 'garment'), related=('get-dressed', 'put-on', 'take-off')),
    R('put-on', 'put on', 'verb', [
        T('induō, induere, induī, indūtum', 'recommended', 'classical', 'put on'),
      ], [ls('induo'), COMPOSED], [P('Vestēs induāmus.', 'Let’s put our clothes on.')],
      sense='clothes', related=('take-off', 'get-dressed', 'clothes')),
    R('take-off', 'take off', 'verb', [
        T('exuō, exuere, exuī, exūtum', 'recommended', 'classical', 'take off'),
        T('dētrahō, dētrahere', 'alternative', 'classical', 'take off (clothes, shoes)', ['Traupman 118']),
      ], [ls('exuo', 'detraho'), TRAUPMAN.format(pages='p. 118'), FABULAE, COMPOSED],
      [P('Hanc vestem exue.', 'Take this garment off.'),
       P('Puer, calceīs, pilleō, paenulā dētractīs, in lectum suum positus est',
         'The boy, his shoes, cap and coat taken off, was put into his own bed', FAB['VI'])],
      sense='clothes', also=('undress', 'get undressed'), related=('put-on', 'get-dressed')),
    R('get-dressed', 'get dressed', 'verb', [
        T('vestiō, vestīre, vestīvī, vestītum', 'recommended', 'classical', 'clothe or dress'),
      ], [ls('vestio'), COMPOSED],
      [P('Vestī tē.', 'Get dressed.'), P('Vīs ut tē adjuvem?', 'Do you want me to help you?')],
      also=('dress', 'clothe'), related=('put-on', 'take-off', 'clothes', 'wrap-up-warm'), replaces=('entry-58',)),
    R('wrap-up-warm', 'wrap up warm', 'verb', [
        T('sē bene operīre', 'recommended', 'modern', 'wrap up warm', ['Traupman 116']),
      ], [ls('operio'), TRAUPMAN.format(pages='p. 116'), FABULAE],
      [P('Sed prius tē bene operī; māne frīgus est.', 'But wrap up warm first; it’s cold in the morning.', FAB['III'])],
      also=('bundle up',), related=('get-dressed',)),
    R('shirt', 'shirt', 'noun', [
        T('subūcula, subūculae f.', 'recommended', 'classical', 'an under-tunic or shirt', ['Mir, morning routine'],
          'Used by Mir for an ordinary shirt.'),
        T('tunica, tunicae f.', 'alternative', 'classical', 'tunic', comment='Useful for a simple shirt by extension.'),
      ], [ls('subucula', 'tunica') + ' · ' + MIR, COMPOSED], [P('Subūculam indue.', 'Put your shirt on.')],
      related=('undershirt', 'sleeve', 'entry-317'), replaces=('entry-59',)),
    R('undershirt', 'undershirt', 'noun', [
        T('interula, interulae f.', 'recommended', 'post-classical', 'undershirt', ['Apul. M. 8 (Lewis &amp; Short)'],
          'A later word, used in the modern routine.'),
      ], [MIR, '<a href="https://logeion.uchicago.edu/interulus" rel="noopener noreferrer" target="_blank">Lewis &amp; Short: interulus</a>'],
      also=('vest',), related=('shirt',)),
    R('nightclothes', 'nightclothes', 'noun', [
        T('vestēs nocturnae', 'recommended', 'ours', 'nightclothes', comment='A modern description.'),
        T('vestis nocturna', 'alternative', 'ours', 'night garment'),
      ], ['Our description, from classical <span lang="la">nocturnus</span>, “of the night”.', COMPOSED],
      [P('Vestēs nocturnās induāmus.', 'Let’s put our nightclothes on.')], also=('nightwear', 'nightgown'), related=('pyjamas',)),
    R('pyjamas', 'pyjamas', 'noun', [
        T('synthesis dormītōria', 'recommended', 'modern', 'pyjamas', ['Traupman 117'],
          'Classically <span lang="la">synthesis</span> is a set of clothes or a loose dinner gown (Mart.).'),
      ], [ls('synthesis'), TRAUPMAN.format(pages='p. 117'), FABULAE],
      [P('Theodōrus, synthesī dormītōriā etiamtum indūtus, in sellā altā sedēbat',
         'Theo, still in his pyjamas, was sitting in his high chair', FAB['III'])],
      also=('pajamas', 'pyjama', 'pajama'), related=('nightclothes',)),
    R('sleeve', 'sleeve', 'noun', [
        T('manicae, manicārum f. pl.', 'recommended', 'classical', 'sleeves', ['Traupman 118', 'Verg. A. 9.616']),
      ], [ls('manicae'), TRAUPMAN.format(pages='p. 118'), FABULAE],
      [P('aquam per culīnam et in manicās suās diffūdit', 'he splashed water all over the kitchen and up his sleeves', FAB['III'])],
      also=('sleeves',), related=('shirt',)),
    R('trousers', 'trousers', 'noun', [
        T('brācae, brācārum f. pl.', 'recommended', 'classical', 'trousers',
          comment='The spelling <strong lang="la">braccae</strong> also occurs, with a different treatment of the consonant and sometimes the vowel. '
                  'This entry uses Lewis &amp; Short’s <strong lang="la">brācae</strong>.'),
      ], [ls('bracae'), COMPOSED],
      [P('Brācās indue.', 'Put your trousers on.'), P('Brācās exue.', 'Take your trousers off.')],
      also=('pair of trousers',), related=('underpants', 'entry-317'), replaces=('entry-60',)),
    R('underpants', 'underpants', 'noun', [
        T('femorālia, femorālium n. pl.', 'recommended', 'late', 'coverings for the thighs', ['Mir, morning routine'],
          'Used by Mir for underpants.'),
      ], [ls('femoralia') + ' · ' + MIR], also=('briefs',), related=('trousers', 'entry-317')),
    R('shoe', 'shoe', 'noun', [
        T('calceus, calceī m.', 'recommended', 'classical', 'shoe', comment='Plural <strong lang="la">calceī</strong>.'),
      ], [ls('calceus'), COMPOSED],
      [P('Calceōs indue.', 'Put your shoes on.'), P('Calceōs exue.', 'Take your shoes off.'),
       P('Ubi alter calceus est?', 'Where is the other shoe?')],
      also=('shoes',), related=('sandal', 'slippers', 'heel', 'socks', 'entry-316', 'entry-315'), replaces=('entry-61',)),
    R('sandal', 'sandal', 'noun', [
        T('solea, soleae f.', 'recommended', 'classical', 'sandal'),
      ], [ls('solea')], also=('sandals',), related=('shoe',)),
    R('slippers', 'slippers', 'noun', [
        T('soccus, soccī m.', 'recommended', 'classical', 'slipper or light shoe; plural soccī, slippers', ['Traupman 113, 118']),
      ], [ls('soccus'), TRAUPMAN.format(pages='pp. 113, 118'), FABULAE],
      [P('pār soccōrum', 'a pair of slippers', 'Traupman 113, 118'),
       P('In vestibulō īdem calceōs exuentibus «Ecce,» inquit, «soccī vestrī,» et utrīque pār suum dedit.',
         'In the hall, as they took off their shoes, he said, “Here are your slippers,” and gave each of them a pair.', FAB['II'])],
      also=('slipper', 'pair of slippers'), related=('shoe',)),
    R('heel', 'heel', 'noun', [
        T('fulmentum, fulmentī n.', 'recommended', 'modern', 'heel of a shoe', ['Traupman 327'], 'Classically a prop or support.'),
      ], [ls('fulmentum'), TRAUPMAN.format(pages='p. 327'), FABULAE],
      [P('fulmenta calceōrum ad canthum rotae posteriōris admovet et terendō cursum tardat',
         'he puts the heels of his shoes to the back tyre and slows down by rubbing', FAB['VII'])],
      sense='of a shoe', related=('shoe',)),
]

# Every Latin form and phrase must occur verbatim in one of the batch's cards.
everything = ' '.join(html.values())
for record in records:
    for item in record['terms'] + record.get('phrases', []):
        assert item['latin'] in everything, (record['id'], item['latin'])

out = ROOT / 'data/concepts'
for record in records:
    path = out / f'{record["id"]}.json'
    assert not path.exists(), path
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
entries = [e for e in json.loads((ROOT / 'data/entries/vestitus.json').read_text(encoding='utf-8')) if e['id'] not in BATCH]
(ROOT / 'data/entries/vestitus.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(len(records), 'records;', len(entries), 'cards left in vestitus')
