(() => {
  const root = document.querySelector('[data-residents-directory]');
  if (!root) return;
  const input = root.querySelector('.search-field input');
  const cards = [...root.querySelectorAll('.resident-card')];
  const buttons = [...root.querySelectorAll('.filter-pills button')];
  const count = root.querySelector('.result-count');
  let period = 'Todos';
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  const yearFrom = (card) => Number((card.querySelector('.resident-date')?.textContent.match(/20\d{2}/) || ['0'])[0]);
  const updateCount = (visible) => {
    if (!count) return;
    const textNode = [...count.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = ` ${visible} historias`;
  };
  const apply = () => {
    const query = normalize(input?.value);
    let visible = 0;
    for (const card of cards) {
      const year = yearFrom(card);
      const inPeriod = period === 'Todos' ||
        (period === '2011–2015' && year > 0 && year <= 2015) ||
        (period === '2016–2019' && year >= 2016 && year <= 2019) ||
        (period === '2020–hoy' && year >= 2020);
      const matches = !query || normalize(card.textContent).includes(query);
      card.hidden = !(inPeriod && matches);
      if (!card.hidden) visible += 1;
    }
    updateCount(visible);
  };
  input?.addEventListener('input', apply);
  for (const button of buttons) button.addEventListener('click', () => {
    period = button.textContent.trim();
    buttons.forEach(item => item.classList.toggle('active', item === button));
    apply();
  });
})();
