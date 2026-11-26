/* FONDO · LAB · Módulo Viajes: interacciones de las tres alternativas */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const press = (btns, on) => btns.forEach((b) => b.setAttribute('aria-pressed', String(on(b))));
  const mqDesk = matchMedia('(min-width: 900px)');

  /* ---------- A · Carta ---------- */
  $$('[data-ca]').forEach((sec) => {
    const tabs = $$('.ca__tab', sec), pins = $$('.ca__pin', sec), chips = $$('.ca__chip', sec);
    const cards = $$('[data-card]', sec), routes = $$('[data-route]', sec);
    const map = $('[data-ca-map]', sec), pan = $('[data-ca-pan]', sec);
    let type = 0, dest = 'cb';

    // Móvil: el mapa es más ancho que la pantalla y se desliza hasta el destino activo
    const panTo = () => {
      if (mqDesk.matches) { pan.style.transform = ''; return; }
      const pin = pins.find((p) => p.dataset.dest === dest);
      const W = map.clientWidth, PW = pan.clientWidth;
      const x = -(+pin.dataset.x * PW - W / 2);
      pan.style.transform = `translateX(${Math.max(W - PW, Math.min(0, x))}px)`;
    };
    const render = () => {
      press(tabs, (b) => +b.dataset.type === type);
      press(chips, (b) => b.dataset.dest === dest);
      [...pins, ...chips].forEach((p) => {
        p.classList.toggle('is-active', p.dataset.dest === dest);
        p.classList.toggle('is-dim', +p.dataset.type !== type);
      });
      routes.forEach((r) => r.classList.toggle('is-dim', r.dataset.route !== dest));
      cards.forEach((c) => { c.hidden = c.dataset.card !== dest; });
      panTo();
    };
    const pickType = (t) => { type = t; dest = pins.find((p) => +p.dataset.type === t).dataset.dest; render(); };
    const pickDest = (el) => { dest = el.dataset.dest; type = +el.dataset.type; render(); };
    tabs.forEach((b) => b.addEventListener('click', () => pickType(+b.dataset.type)));
    [...pins, ...chips].forEach((p) => p.addEventListener('click', () => pickDest(p)));
    addEventListener('resize', panTo);
    // Sin transición en el primer pintado
    pan.style.transition = 'none'; render(); requestAnimationFrame(() => requestAnimationFrame(() => { pan.style.transition = ''; }));
  });

  /* ---------- B · Ficha ---------- */
  $$('[data-fi]').forEach((sec) => {
    const btns = $$('.fbtn', sec), fichas = $$('.ficha', sec), rail = $('[data-fi-rail]', sec);
    const prev = $('[data-fi-prev]', sec), next = $('[data-fi-next]', sec);
    const visible = () => fichas.filter((f) => !f.hidden);
    const arrows = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2; next.disabled = rail.scrollLeft >= max;
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      press(btns, (x) => x === b);
      fichas.forEach((f) => { f.hidden = f.dataset.type !== b.dataset.type; });
      rail.scrollTo({ left: 0 }); arrows();
    }));
    const step = (dir) => { const f = visible()[0]; if (f) rail.scrollBy({ left: dir * (f.offsetWidth + 16), behavior: 'smooth' }); };
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    rail.addEventListener('scroll', arrows, { passive: true });
    addEventListener('resize', arrows); arrows();
  });

  /* ---------- C · Isobatas ---------- */
  $$('[data-is]').forEach((sec) => {
    const toggles = $$('.is__toggle', sec), panels = $$('.is__panel', sec);
    const open = (panel) => {
      panels.forEach((p) => {
        const on = p === panel;
        p.classList.toggle('is-open', on);
        $('.is__tab', p).setAttribute('aria-expanded', String(on));
      });
      press(toggles, (t) => t.dataset.type === panel.dataset.type);
    };
    toggles.forEach((t) => t.addEventListener('click', () => open(panels.find((p) => p.dataset.type === t.dataset.type))));
    panels.forEach((p) => $('.is__tab', p).addEventListener('click', () => open(p)));
  });
})();
