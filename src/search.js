(() => {
  const search = document.getElementById('search');
  const clear = document.getElementById('clear');
  const resultText = document.getElementById('results');
  const entries = [...document.querySelectorAll('[data-entry]')];
  const sections = [...document.querySelectorAll('[data-category-section]')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const empty = document.getElementById('empty');
  const total = entries.length;
  let active = 'all';

  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/æ/g,'ae').replace(/œ/g,'oe');

  function apply() {
    const q = fold(search.value.trim());
    let shown = 0;
    entries.forEach(entry => {
      const categoryOK = active === 'all' || entry.dataset.category === active;
      const textOK = !q || fold((entry.dataset.search || '') + ' ' + entry.textContent).includes(q);
      const visible = categoryOK && textOK;
      entry.hidden = !visible;
      if (visible) shown++;
    });
    sections.forEach(section => {
      section.hidden = ![...section.querySelectorAll('[data-entry]')].some(e => !e.hidden);
    });
    resultText.textContent = `Showing ${shown} of ${total}`;
    empty.style.display = shown ? 'none' : 'block';
  }

  ['input', 'change', 'search'].forEach(event => search.addEventListener(event, apply));
  chips.forEach(chip => chip.addEventListener('click', () => {
    active = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    apply();
  }));
  clear.addEventListener('click', () => {
    search.value = '';
    active = 'all';
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
    search.focus();
    apply();
  });
  search.addEventListener('keydown', e => { if (e.key === 'Escape') clear.click(); });
  apply();
})();
