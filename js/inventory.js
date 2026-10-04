(() => {
  'use strict';
  const weights = ['190', '210', '230', '240'];
  const fields = ['rolls', 'yards', 'meters'];
  function parse(value, field) {
    const text = String(value ?? '').trim().replace(',', '.');
    if (text === '') return '';
    const n = Number(text);
    if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(n) || n > Number.MAX_SAFE_INTEGER) throw Error('Введите неотрицательное число.');
    if (field === 'rolls' && !Number.isInteger(n)) throw Error('Рулоны — целое число.');
    return text;
  }
  const panels = [];
  function initInventory() {
  document.querySelectorAll('.inventory').forEach(p => {if(!panels.includes(p)) panels.push(p);});
  const animations = new WeakMap();
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function expand(panel, open) {
    const start = panel.getBoundingClientRect().height;
    const running = animations.get(panel);
    if (running) { running.onfinish = null; running.cancel(); }
    panel.style.height = '';
    panel.open = true;
    panel.dataset.expanded = String(open);
    const summary = panel.querySelector('summary');
    summary.setAttribute('aria-expanded', String(open));
    const style = getComputedStyle(panel);
    const collapsed = summary.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const end = open ? panel.getBoundingClientRect().height : collapsed;
    if (reduced() || !panel.animate) { panel.open = open; return; }
    const animation = panel.animate([{height: start + 'px'}, {height: end + 'px'}], {duration: 320, easing: 'cubic-bezier(.22,1,.36,1)'});
    animations.set(panel, animation);
    animation.onfinish = () => { panel.open = open; animations.delete(panel); };
  }
  panels.forEach(panel => {
    if(panel.dataset.stockBound) return; panel.dataset.stockBound='true';
    panel.dataset.expanded = 'false';
    panel.querySelector('summary').setAttribute('aria-expanded', 'false');
    panel.querySelector('summary').addEventListener('click', event => {
      event.preventDefault();
      const open = panel.dataset.expanded !== 'true';
      if (open) panels.forEach(other => { if (other !== panel && other.dataset.expanded === 'true') expand(other, false); });
      expand(panel, open);
    });
  });
  document.querySelectorAll('.stock-form').forEach(form => {
    if(form.dataset.stockBound) return; form.dataset.stockBound='true';
    const key = 'podklad-pro:stock:v2:' + form.dataset.code;
    const status = form.querySelector('.stock-status');
    const summary = form.closest('.inventory').querySelector('.stock-summary');
    const entries = weights.flatMap(weight => fields.map(field => ({weight, field, input: form.elements.namedItem(field + '-' + weight)})));
    const report = (text, error = false) => { status.textContent = text; status.classList.toggle('error', error); };
    const show = record => {
      const filled = weights.filter(w => fields.some(f => record[w]?.[f] !== '' && record[w]?.[f] != null));
      summary.textContent = filled.length ? filled.map(w => w + ' г').join(' · ') : 'Не указаны';
    };
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const record = JSON.parse(raw);
        if (!record || typeof record !== 'object' || Array.isArray(record)) throw Error();
        const clean = Object.fromEntries(weights.map(w => [w, {}]));
        entries.forEach(({weight, field}) => { clean[weight][field] = parse(record[weight]?.[field], field); });
        entries.forEach(({weight, field, input}) => { input.value = clean[weight][field]; });
        show(clean); report('Записи загружены');
      }
      const oldRaw = localStorage.getItem('podklad-pro:stock:v1:' + form.dataset.code);
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        const text = fields.map((f, i) => { const value = parse(old[f], f); return value === '' ? '' : value + ' ' + ['рул.', 'ярд.', 'м'][i]; }).filter(Boolean).join(' · ');
        if (text) { const note = form.querySelector('.legacy-stock'); note.hidden = false; note.textContent = 'Ранее, без граммажа: ' + text + '. Укажите эти остатки в нужной строке.'; }
      }
    } catch { report('Не удалось загрузить часть записей браузера.', true); }
    entries.forEach(({input}) => input.addEventListener('input', () => { input.setCustomValidity(''); report('Не сохранено'); }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      const record = Object.fromEntries(weights.map(w => [w, {}]));
      for (const {weight, field, input} of entries) {
        try { record[weight][field] = parse(input.value, field); input.setCustomValidity(''); }
        catch (error) { input.setCustomValidity(error.message); input.reportValidity(); report(error.message, true); return; }
      }
      try {
        localStorage.setItem(key, JSON.stringify(record));
        entries.forEach(({weight, field, input}) => { input.value = record[weight][field]; });
        show(record); report('Сохранено на устройстве');
        const button = form.querySelector('.save-stock');
        if (!reduced() && button.animate) button.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}], {duration:250});
      } catch { report('Не удалось сохранить. Проверьте разрешения и свободное место браузера.', true); }
    });
  });
}
  initInventory();
  document.addEventListener('catalogchanged',initInventory);
})();
