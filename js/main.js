/* =========================================================================
   FONDO · Web v4 · Interacciones (home, viaje y sobre nosotros)
   Sin dependencias. Cada bloque es independiente.
   Las interacciones de cursor solo se activan con ratón (hover + pointer fine).
   ========================================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mqStage = matchMedia('(min-width: 900px) and (min-height: 600px)'); // Viajes en modo «sticky»
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const isMouse = (e) => e.pointerType === 'mouse' && mqFine.matches;
  const smooth = () => (mqReduce.matches ? 'auto' : 'smooth');

  /* ---------- Ajustes ----------
     whatsapp: número con prefijo y sin «+» ni espacios (p. ej. '34600000000').
               Vacío: WhatsApp abre con el texto y deja elegir el contacto.
     formEndpoint: dirección a la que se envía la lista de espera (POST).
               Vacío: el formulario se valida y da las gracias, pero no envía nada. */
  const FONDO = {
    whatsapp: '', formEndpoint: '',
    // Sonidos desde el fondo: audio propio que suena al pulsar el vinilo (ruta desde la raíz)
    audio: '/assets/audio/sonidos-desde-el-fondo.mp3',
  };

  /* ---------- Toast ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };

  /* =======================================================================
     1. Cabecera fija sin fondo
        Cada elemento (logo, enlaces, idioma) mira qué tiene justo detrás y se
        pone blanco o negro, el que más contraste dé:
        · data-theme="dark|light" en un elemento fuerza el tono;
        · sobre una foto o un vídeo, mide la luminosidad de esa zona (en el vídeo,
          del fotograma que se ve en ese momento);
        · data-shade="0.42" es un degradado negro encima (0,42 arriba → 0 abajo;
          con data-shade-dir="up", al revés): oscurece lo que haya debajo;
        · si no, usa el color de fondo de la sección.
        (Sobre file:// el navegador no deja leer las fotos y usa el color de la sección.)
     ======================================================================= */
  (() => {
    const header = $('[data-header]');
    if (!header) return;
    const items = $$('[data-tone]', header);
    const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lumRGB = (r, g, b) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);

    // Mapa de luminosidad (24×24) de cada foto, calculado una vez
    const maps = new WeakMap();
    const N = 24;
    const lumMap = (img) => {
      if (maps.has(img)) return maps.get(img);
      if (!img.complete || !img.naturalWidth) return null;
      let grid = null;
      try {
        const c = document.createElement('canvas'); c.width = N; c.height = N;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, N, N);
        const d = ctx.getImageData(0, 0, N, N).data;
        grid = new Float32Array(N * N);
        for (let i = 0; i < N * N; i++) grid[i] = lumRGB(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      } catch (_) { grid = null; }
      maps.set(img, grid);
      return grid;
    };
    /* Vídeos del hero: en vez de leer cada fotograma (el tono iría siempre un poco tarde y
       cambiaría con cada plano), cada vídeo trae un mapa 24×24 con la luminosidad mediana de
       todo el bucle (d = versión horizontal, m = recorte vertical de móvil). Así cada elemento
       de la cabecera toma el tono que mejor se lee durante la mayor parte del vídeo y no
       parpadea. Se generan con ffmpeg (ver README). Si un vídeo no tiene mapa, se lee el
       fotograma actual. */
    const VIDEO_LUM = {
      buzo: { d: 'PCxCWl9yeHZ8aUw9KiEgHiUpJCwtZVa6LygzV2t2eXh8XCssIBoZGSMhIy0qQZCiIx0qQm14enhvTSgiJxwaGBwhIDAgJKekIRkqMGp4fHJfXCMdJRkXHhweIiYlMpWPICIpOmh5fXJxJx0aHhsZIh8eISUcOZ9yHycuNl92dnN3LiIhGhwfIR4fHikoPlx7FR4oNU93eHRoNiofIxsdGh4ZGCUnTmZyGiMsNll3eHVsMi0bHhcYFxYaGiQqRmRmIisxQEp3d3VeSCshGhsVFRQWGyAjOF1fJi01SFJxeXVePyohGRgVFRMVGyMhM0tSJi0zOENyeXRhMSgiGRYVFRQYFyAkKThQJicvN0Zld2ZaMykmGBUUFBMVExcgICVCJCYvMkhccklcOCwrFhQUExMTExMbGx4+IScvMkZZWUBbSjInGBYUExMTEhITFRs8HyYwN0JPSk9QVTEnGBUUExISEhISFBg6ISw0OUJVSEpaWTEpHBQTExISEhESFB4vHyk0PEpXTEtWTyUuHBUTEhIRERERFBgfHio2PVNVSUNHUCclHRMSExIRERARExcuHSw3QVlfUEpITDYiFhYUEhERERERERQfHDI5QVFfYlFVV0grGxMTEREQEBAQERQqIzQ8REloZFdLVU0zHRMSERAQEBAQEBczJS82QVFraVFTW0wlFxMRERAQEBAQEBc5JC81QFhtcWBWYF8tFRIREBAQEBAQEBU7KzEySVdycGVkY2AsFhIREBAQEBAQEBg5', m: 'eHp7e3hmYFM7NjMzKykoKBweGx4hGBkbeHx8emtaSDorKCUnIx4eHx4aGBgXGRcYdHZxcV5AQSsoISAfGCMkHRwaGBYXGBcWdGxwXj9BOSUhJB0aHiAlJRwYGBgXFhYXaXB0YikkIyQhHxsbGRwgHhgYGRcXGBkccXV3azQtKCEfGh0gIR0cGBobGBcXGx4ccHZtPTQzLiklIiAcHh8gHRsXFxcYGRoXVHNuUjEwMTMqJh8aGxsaGRgWFxYXFhYWcW9hcDQ0OjUpKCgZGRkXFxgZGBcVFRUVY2prUFUwLyspJiQhGhwZFxgXFxUUFBQVbGtiVUAvLCsoJCQfGhoZGRcXFRUUFBQUb2NdUDEtMCspKSooHxkXFxYVFBUVFBQUW2dgRkQvKywtKSkrIRsVFRQUFBQUFBQUQFdcSkY9Piw0KSYqJBgXFRQVFBQUFBMTRklWWF5QRDw5LColHRkYFRUUFRQUExMTUFlRYl5WW0ksLC0pJCIgFRQVFBMTExMTRElOV1tLPyoiKykvKCYfFxUUExQTExMSMT9PVVhRNjcpJi0oIh8eFxcUFBQSEhMTOzxDUFc5SjsyKiUjHhYUFRQTExMTEhISTVNQV11fV0Q+PyQlHh0WFxISExISExIRVFFIRlpWT0c7PCwsHRsXExQTEhISEhIRQ01TUVBSWV9UNTsiGhcXGBMTEhESEREQXldVYWJjX2hkQj8kGRYUExMRERERERAQZ2RdZGViZGVkUjMiFxQUFBMRERIREBAQ' }
    };
    const decodedLum = {};
    const videoKey = (v) => (/-movil/.test(v.currentSrc || v.getAttribute('src') || v.poster || '') ? 'm' : 'd');
    const vmaps = new WeakMap();
    const lumMapVideo = (v) => {
      const id = v.dataset.video, key = videoKey(v);
      const enc = VIDEO_LUM[id] && VIDEO_LUM[id][key];
      if (enc) {
        const k = id + key;
        if (!decodedLum[k]) {
          const bin = atob(enc), g = new Float32Array(N * N);
          for (let i = 0; i < N * N; i++) { const x = bin.charCodeAt(i) / 255; g[i] = x * x; }
          decodedLum[k] = g;
        }
        return decodedLum[k];
      }
      // sin mapa: fotograma actual (como mucho cada 250 ms)
      if (v.readyState < 2 || !v.videoWidth) return null;
      const now = performance.now();
      const c = vmaps.get(v);
      if (c && now - c.t < 250) return c.grid;
      let grid = null;
      try {
        const cv = (c && c.cv) || document.createElement('canvas'); cv.width = N; cv.height = N;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(v, 0, 0, N, N);
        const d = ctx.getImageData(0, 0, N, N).data;
        grid = new Float32Array(N * N);
        for (let i = 0; i < N * N; i++) grid[i] = lumRGB(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
        vmaps.set(v, { t: now, grid, cv });
      } catch (_) { grid = null; }
      return grid;
    };
    // Luminosidad de la foto (o del vídeo) en un punto de la pantalla (respeta object-fit: cover y object-position)
    const lumAtImg = (img, x, y) => {
      const isVideo = img.tagName === 'VIDEO';
      const grid = isVideo ? lumMapVideo(img) : lumMap(img);
      if (!grid) return null;
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const vk = isVideo && videoKey(img);
      const nw = isVideo ? (img.videoWidth || (vk === 'm' ? 1080 : 1920)) : img.naturalWidth;
      const nh = isVideo ? (img.videoHeight || (vk === 'm' ? 1920 : 1080)) : img.naturalHeight;
      const s = cs.objectFit === 'cover' ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh);
      const [px, py] = cs.objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const dw = nw * s, dh = nh * s;
      const u = (x - r.left - (r.width - dw) * (isNaN(px) ? 0.5 : px)) / dw;
      const v = (y - r.top - (r.height - dh) * (isNaN(py) ? 0.5 : py)) / dh;
      if (u < 0 || u > 1 || v < 0 || v > 1) return null;
      return grid[Math.min(N - 1, Math.floor(v * N)) * N + Math.min(N - 1, Math.floor(u * N))];
    };
    const hidden = (el) => {
      for (let n = el, k = 0; n && k < 4; n = n.parentElement, k++) if (getComputedStyle(n).opacity === '0') return true;
      return false;
    };
    // Luminosidad de lo que hay detrás de un punto (null si no se sabe)
    const lumAt = (x, y) => {
      let k = 1;   // lo que dejan pasar los degradados que haya encima
      for (const el of document.elementsFromPoint(x, y)) {
        if (header.contains(el) || el.closest('.fl')) continue;   // ignora el loader
        const t = el.getAttribute('data-theme');
        if (t) return t === 'dark' ? 0 : 1;
        const shade = el.getAttribute('data-shade');
        if (shade) {
          const r = el.getBoundingClientRect();
          const p = clamp((y - r.top) / r.height, 0, 1);
          k *= 1 - parseFloat(shade) * (el.getAttribute('data-shade-dir') === 'up' ? p : 1 - p);
          continue;
        }
        if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
          if (hidden(el)) continue;
          const l = lumAtImg(el, x, y);
          if (l != null) return l * k;
          continue;
        }
        // Formas SVG de la marca (wordmark, isotipo): pintan con currentColor.
        // El <svg> raíz es solo la caja; sus formas solo aparecen aquí si el punto cae encima.
        if (el instanceof SVGElement) {
          if (el.tagName.toLowerCase() === 'svg' || el.closest('[data-ink]')) continue;
          const c = getComputedStyle(el).color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
          if (c) return lumRGB(+c[1], +c[2], +c[3]);
          continue;
        }
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
        if (m && (m[4] === undefined || parseFloat(m[4]) > 0.5)) return lumRGB(+m[1], +m[2], +m[3]) * k;
      }
      return 1;
    };
    // Cada elemento vota con 15 puntos: gana el tono legible sobre más superficie
    const XS = [0.08, 0.29, 0.5, 0.71, 0.92], YS = [0.3, 0.5, 0.7];
    /* Con el scroll el cambio es inmediato. Si lo de detrás cambia solo (el vídeo),
       el nuevo tono tiene que mantenerse 0,7 s antes de aplicarse: así el texto no
       parpadea con cada plano. */
    const HOLD = 700;
    const pend = new WeakMap();
    let instant = true;
    const update = () => {
      const now = performance.now();
      items.forEach((it) => {
        const r = it.getBoundingClientRect();
        if (!r.width) return;
        let dark = 0, n = 0;
        XS.forEach((a) => YS.forEach((b) => {
          const l = lumAt(r.left + r.width * a, r.top + r.height * b);
          if (l == null) return;
          n++; if (l < 0.18) dark++;     // 0.18 ≈ punto en que blanco y negro dan el mismo contraste
        }));
        if (!n) return;
        const share = dark / n, cur = it.dataset.tone;
        const tone = cur === 'dark' ? (share >= 0.4 ? 'dark' : 'light') : (share > 0.6 ? 'dark' : 'light');
        if (cur === tone) { pend.delete(it); return; }
        if (!instant) {
          const p = pend.get(it);
          if (!p || p.tone !== tone) { pend.set(it, { tone, t: now }); return; }
          if (now - p.t < HOLD) return;
        }
        pend.delete(it);
        it.dataset.tone = tone;
      });
      instant = false;
    };
    /* Cabecera «tinta»: una copia de la cabecera en negro, recortada con la forma del
       wordmark del hero. Así, cuando el wordmark blanco pasa por detrás, el texto se ve
       negro justo encima de las letras y blanco en el resto (píxel a píxel). */
    const inkSource = $('[data-ink]');
    const inkShape = document.getElementById('ink-clip-shape');
    let syncInk = () => {};
    if (inkSource && inkShape) {
      const ink = header.cloneNode(true);
      ink.classList.add('site-header--ink');
      ink.removeAttribute('data-header');
      ink.setAttribute('aria-hidden', 'true');
      ink.inert = true;
      $$('[id]', ink).forEach((e) => e.removeAttribute('id'));
      $$('[data-menu-open]', ink).forEach((e) => e.removeAttribute('data-menu-open'));
      header.after(ink);
      syncInk = () => {
        const r = inkSource.getBoundingClientRect();
        const h = header.offsetHeight;
        const on = r.top < h && r.bottom > 0 && r.width > 0;
        ink.classList.toggle('is-on', on);
        if (on) inkShape.setAttribute('transform', `translate(${r.left.toFixed(2)} ${r.top.toFixed(2)}) scale(${(r.width / 1376).toFixed(5)})`);
      };
      addEventListener('scroll', () => requestAnimationFrame(syncInk), { passive: true });
      addEventListener('resize', syncInk);
      syncInk();
    }

    // Como mucho cada 60 ms durante el scroll
    let ticking = false, last = 0;
    const queueNow = () => { instant = true; queue(); };
    const queue = () => {
      if (ticking) return;
      ticking = true;
      const wait = Math.max(0, 60 - (performance.now() - last));
      setTimeout(() => requestAnimationFrame(() => { update(); last = performance.now(); ticking = false; }), wait);
    };
    addEventListener('scroll', queueNow, { passive: true });
    addEventListener('resize', queueNow);
    addEventListener('load', queueNow);
    document.addEventListener('fondoloader:hide', queueNow);
    $$('img').forEach((img) => img.addEventListener('load', queue));
    $$('video').forEach((v) => v.addEventListener('loadeddata', queue));
    setInterval(queue, 400);   // por si cambia lo de detrás sin scroll (vídeo, secuencia de fotos, acordeón)
    update();
  })();

  /* =======================================================================
     1b. Vídeo del hero: solo se reproduce mientras se ve (ahorra batería).
         El <script> junto al vídeo ya decidió si carga y qué versión.
     ======================================================================= */
  $$('[data-hero-video]').forEach((v) => {
    const play = () => { if (!v.getAttribute('src')) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()), { threshold: 0.01 }).observe(v);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && v.getBoundingClientRect().bottom > 0) play(); });
  });


  /* =======================================================================
     3. Viajes
        Desktop: la sección se queda fija; cada paso de scroll (con snap suave,
        la «fricción») sube la tira de tarjetas y marca a la izquierda el tipo
        de viaje de la tarjeta activa. Clic en un tipo lleva a su primer viaje.
        Mobile / pantallas bajas: carrusel horizontal sincronizado con los tipos.
     ======================================================================= */
  (() => {
    const sec = $('[data-viajes]');
    if (!sec) return;
    const strip = $('[data-strip]', sec);
    const cards = $$('.tcard', strip);
    const filters = $$('[data-filter]', sec);
    const n = cards.length;
    const typeOf = (i) => Number(cards[i].dataset.type || 0);
    let active = -1;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      cards.forEach((c, k) => c.classList.toggle('is-current', k === i));
      strip.style.setProperty('--i', i);
      const t = typeOf(i);
      filters.forEach((f) => f.setAttribute('aria-pressed', String(Number(f.dataset.filter) === t)));
    };
    setActive(0);

    const range = () => sec.offsetHeight - innerHeight;
    const secTop = () => sec.getBoundingClientRect().top + scrollY;

    let ticking = false;
    const onScroll = () => {
      if (!mqStage.matches || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const p = clamp(-sec.getBoundingClientRect().top / range(), 0, 1);
        setActive(Math.round(p * (n - 1)));
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    const goTo = (i, { fromOutside = false } = {}) => {
      if (mqStage.matches) {
        scrollTo({ top: secTop() + (range() * i) / (n - 1), behavior: smooth() });
      } else {
        if (fromOutside) sec.scrollIntoView({ behavior: smooth(), block: 'start' });
        const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
        strip.scrollTo({ left: cards[i].offsetLeft - pad, behavior: smooth() });
        setActive(i);
      }
    };
    const firstOfType = (t) => Math.max(0, cards.findIndex((c, k) => typeOf(k) === t));
    filters.forEach((f) => f.addEventListener('click', () => goTo(firstOfType(Number(f.dataset.filter)))));
    cards.forEach((c, i) => c.addEventListener('focus', () => { if (mqStage.matches && i !== active) goTo(i); }));

    // Enlaces de fuera que llevan a un tipo de viaje («Ya tengo el Open Water»)
    $$('[data-goto-type]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(firstOfType(Number(a.dataset.gotoType)), { fromOutside: true });
    }));

    // Carrusel: la tarjeta activa es la que queda alineada a la izquierda (o la última al llegar al final)
    strip.addEventListener('scroll', () => requestAnimationFrame(() => {
      if (mqStage.matches) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
      setActive(strip.scrollLeft >= max - 2 ? n - 1 : clamp(Math.round(strip.scrollLeft / step), 0, n - 1));
    }), { passive: true });

    mqStage.addEventListener('change', () => { strip.scrollLeft = 0; onScroll(); });
  })();


  /* =======================================================================
     4. Óvalos que siguen al cursor (guía, hero del viaje y footer)
        El óvalo sigue al puntero siempre, también fuera de su zona; la zona
        hace de ventana y lo recorta. Así, al entrar, el óvalo «entra» con el
        ratón cortado por el borde, sin aparecer ni crecer; al salir se va
        con él. En táctil quedan fijos como sello (lo resuelve el CSS).
        En el footer, sobre un enlace, el óvalo muestra el nombre del enlace.
        Con teclado se coloca en el centro de la zona.
     ======================================================================= */
  (() => {
    const items = $$('[data-follow-area]').map((area) => {
      const el = $('[data-follow]', area);
      if (!el) return null;
      const label = el.querySelector('span');
      return { area, el, label, html: label ? label.innerHTML : '', cx: -2000, cy: -2000, tx: -2000, ty: -2000, inside: false };
    }).filter(Boolean);
    if (!items.length) return;

    let px = -9999, py = -9999, raf = 0;
    const paint = (it) => { it.el.style.translate = `${it.cx.toFixed(2)}px ${it.cy.toFixed(2)}px`; };
    const aim = (it, x, y) => {
      const r = it.el.getBoundingClientRect();
      it.tx = x - (r.left - it.cx + r.width / 2);
      it.ty = y - (r.top - it.cy + r.height / 2);
    };
    const tick = () => {
      raf = 0;
      const k = mqReduce.matches ? 1 : 0.2;
      let moving = false;
      for (const it of items) {
        if (Math.abs(it.cx - it.tx) < 0.2 && Math.abs(it.cy - it.ty) < 0.2) continue;
        it.cx = lerp(it.cx, it.tx, k); it.cy = lerp(it.cy, it.ty, k); paint(it); moving = true;
      }
      if (moving) raf = requestAnimationFrame(tick);
    };
    const near = (it) => {
      const r = it.area.getBoundingClientRect(), m = it.el.offsetWidth;
      return px > r.left - m && px < r.right + m && py > r.top - m && py < r.bottom + m;
    };
    const update = () => {
      if (!mqFine.matches) return;
      for (const it of items) {
        if (!near(it) && Math.abs(it.cx - it.tx) < 0.2) continue;   // lejos y quieto: no hace falta moverlo
        aim(it, px, py);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', (e) => { if (!isMouse(e)) return; px = e.clientX; py = e.clientY; update(); }, { passive: true });
    addEventListener('scroll', update, { passive: true });
    // Con ratón empiezan fuera de pantalla; en táctil se quedan quietos como sello
    const reset = () => items.forEach((it) => { if (mqFine.matches) paint(it); else it.el.style.translate = ''; });
    reset();
    mqFine.addEventListener('change', reset);

    for (const it of items) {
      const { area, el, label } = it;
      area.addEventListener('pointerenter', (e) => { if (isMouse(e)) { it.inside = true; area.classList.add('has-cursor'); } });
      area.addEventListener('pointerleave', () => {
        it.inside = false; area.classList.remove('has-cursor');
        if (label) label.innerHTML = it.html;
      });
      // Teclado: el óvalo se coloca en el centro de la zona
      area.addEventListener('focusin', () => {
        if (it.inside || !mqFine.matches) return;
        const r = area.getBoundingClientRect();
        aim(it, r.left + r.width / 2, r.top + r.height / 2); it.cx = it.tx; it.cy = it.ty; paint(it);
      });
      if (el.hasAttribute('data-cursor-default') && label) {
        area.addEventListener('pointerover', (e) => {
          const a = e.target.closest('a, button');
          if (a && area.contains(a) && it.inside) label.textContent = a.textContent.trim();
        });
        area.addEventListener('pointerout', (e) => {
          const a = e.target.closest('a, button');
          if (a && !a.contains(e.relatedTarget)) label.innerHTML = it.html;
        });
      }
    }
  })();

  /* =======================================================================
     5. Manifiesto: dos frases, dos fotos. La foto va siempre detrás del texto.
        Con ratón: la foto aparece al entrar en la zona, sigue al puntero y
        cambia con la frase que pisas. Al salir, desaparece.
        Sin ratón: la frase que cruza el centro de la pantalla se activa y la
        foto (fija detrás del texto) cambia con ella.
     ======================================================================= */
  (() => {
    const sec = $('[data-manifiesto]');
    if (!sec) return;
    const phrases = $$('[data-phrase]', sec);
    const photo = $('[data-photo]', sec);
    const imgs = $$('img', photo);
    const OFFSET = 24;                                   // separación foto-puntero
    let current = 0, inside = false;
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;

    const setPhrase = (i) => {
      if (i === current) return;
      current = i;
      phrases.forEach((p, k) => p.classList.toggle('is-active', k === i));
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    };

    const paint = () => { photo.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`; };
    const tick = () => {
      const k = mqReduce.matches ? 1 : 0.16;
      cx = lerp(cx, tx, k); cy = lerp(cy, ty, k); paint();
      raf = inside && (Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2) ? requestAnimationFrame(tick) : 0;
    };
    const target = (e) => {
      const s = sec.getBoundingClientRect();
      const w = photo.offsetWidth, h = photo.offsetHeight;
      // a la derecha y abajo del puntero; si no cabe, al otro lado
      let x = e.clientX - s.left + OFFSET;
      let y = e.clientY - s.top + OFFSET;
      if (x + w > s.width) x = e.clientX - s.left - OFFSET - w;
      if (y + h > s.height) y = e.clientY - s.top - OFFSET - h;
      tx = clamp(x, 0, s.width - w); ty = clamp(y, 0, s.height - h);
    };

    sec.addEventListener('pointerenter', (e) => {
      if (!isMouse(e)) return;
      inside = true;
      target(e); cx = tx; cy = ty; paint();
      requestAnimationFrame(() => photo.classList.add('is-visible'));
    });
    sec.addEventListener('pointermove', (e) => {
      if (!inside || !isMouse(e)) return;
      target(e);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    sec.addEventListener('pointerleave', () => {
      if (!inside) return;
      inside = false;
      photo.classList.remove('is-visible');
    });

    phrases.forEach((p, i) => {
      p.addEventListener('pointerenter', (e) => { if (isMouse(e)) setPhrase(i); });
      p.addEventListener('focus', () => setPhrase(i));
      p.addEventListener('click', () => setPhrase(i));
    });

    // Sin ratón: la frase que cruza el centro de la pantalla se activa
    const io = new IntersectionObserver((entries) => {
      if (inside) return;
      entries.forEach((e) => { if (e.isIntersecting) setPhrase(phrases.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    phrases.forEach((p) => io.observe(p));

    mqFine.addEventListener('change', () => { photo.style.translate = ''; photo.classList.remove('is-visible'); });
  })();

  /* =======================================================================
     6. Acordeón «Cómo viajamos»: una fila abierta cada vez.
     ======================================================================= */
  $$('[data-accordion]').forEach((acc) => {
    const items = $$('.acc__item', acc);
    items.forEach((item) => {
      const btn = $('.acc__head', item);
      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((it) => {
          it.classList.remove('is-open');
          $('.acc__head', it).setAttribute('aria-expanded', 'false');
        });
        if (!willOpen) return;
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        // Que la fila abierta quede a la vista
        setTimeout(() => {
          const r = item.getBoundingClientRect();
          const headerH = 96;
          if (r.top < headerH || r.bottom > innerHeight) {
            scrollTo({ top: scrollY + r.top - headerH, behavior: smooth() });
          }
        }, 460);
      });
    });
  });

  /* =======================================================================
     7. Formularios de suscripción (sin backend todavía)
     ======================================================================= */
  $$('form[data-subscribe]').forEach((form) => {
    const input = $('input[type="email"]', form);
    const msg = $('.field__msg', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.remove('is-error');
      if (!input.value.trim() || !input.checkValidity()) {
        form.classList.add('is-error');
        msg.textContent = 'Revisa el email, parece que falta algo.';
        input.focus();
        return;
      }
      // TODO: conectar con la herramienta de newsletter (Mailchimp, Brevo, etc.)
      form.classList.add('is-done');
      msg.textContent = 'Listo. Te escribimos con la próxima carta.';
      input.value = '';
    });
    input.addEventListener('input', () => { form.classList.remove('is-error', 'is-done'); msg.textContent = ''; });
  });

  /* =======================================================================
     8. Compartir y enlaces pendientes
     ======================================================================= */
  $$('[data-share]').forEach((a) => a.addEventListener('click', async (e) => {
    e.preventDefault();
    const data = { title: 'Fondo · Viajes de buceo', text: 'Mira esto, ¿te vienes?', url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(location.href);
      toast('Enlace copiado. Pásaselo a quien quieras.');
    } catch (_) { /* el usuario canceló */ }
  }));

  $$('[data-todo]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    toast(`Pendiente: ${a.dataset.todo}.`);
  }));

  $$('.site-header__lang, [data-lang]').forEach((b) => b.addEventListener('click', () => toast('Versión en inglés, próximamente.')));


  /* =======================================================================
     8b. Carrusel «Dónde pasa» (página de viaje)
         Se arrastra con el dedo, el trackpad o el ratón y encaja tarjeta a
         tarjeta (scroll-snap). En desktop también con las flechas, que se
         apagan en los extremos.
     ======================================================================= */
  $$('[data-carousel]').forEach((box) => {
    const track = $('[data-track]', box);
    const prev = $('[data-prev]', box), next = $('[data-next]', box);
    if (!track) return;
    const step = () => {
      const first = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first ? first.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: smooth() }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: smooth() }));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', sync);
    sync();

    // Arrastrar con el ratón
    let down = false, moved = false, startX = 0, startL = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startL = track.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startL - dx;
    });
    addEventListener('pointerup', (e) => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const s = step();
      const dx = e.clientX - startX;
      const from = Math.round(startL / s);
      let to = Math.round(track.scrollLeft / s);
      if (to === from && Math.abs(dx) > 40) to += dx < 0 ? 1 : -1;
      track.classList.remove('is-dragging');
      track.scrollTo({ left: Math.max(0, to) * s, behavior: smooth() });
    });
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', (e) => e.preventDefault());
  });


  /* =======================================================================
     8c. Entradas al llegar a la vista (gráfico de profundidad)
     ======================================================================= */
  (() => {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    if (mqReduce.matches || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: 0.35 });
    els.forEach((el) => io.observe(el));
  })();

  /* =======================================================================
     9. Menú móvil (< 900 px)
        Se abre con el botón de dos líneas y se cierra con la X, con Escape,
        al elegir un enlace o al pasar a desktop. Mientras está abierto:
        la página no hace scroll ni recibe el foco (inert), el foco no sale
        del menú y la barra del navegador se tiñe de azul.
     ======================================================================= */
  (() => {
    const menu = $('[data-menu]');
    const openBtn = $('[data-menu-open]');
    if (!menu || !openBtn) return;
    const closeBtn = $('[data-menu-close]', menu);
    // La cabecera no se bloquea: su botón (dos líneas que giran a X) abre y cierra el menú
    const behind = [$('.page'), $('.site-header--ink'), $('[data-dock-pill]')].filter(Boolean);
    const meta = $('meta[name="theme-color"]');
    const metaDefault = meta ? (meta.getAttribute('data-default') || meta.content) : '';
    const mqMobile = matchMedia('(max-width: 899px)');
    let isOpen = false, lastFocus = null;

    const focusables = () => $$('a[href], button:not([disabled])', menu);
    const setOpen = (open, { restoreFocus = true } = {}) => {
      if (open === isOpen) return;
      isOpen = open;
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      openBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.documentElement.classList.toggle('menu-open', open);
      behind.forEach((el) => { el.inert = open; });
      if (meta) meta.content = open ? '#1e57b1' : metaDefault;
      if (open) {
        lastFocus = document.activeElement;
        menu.scrollTop = 0;
        const first = $('.mmenu__nav a', menu) || closeBtn;
        setTimeout(() => first.focus({ preventScroll: true }), 80);
      } else if (restoreFocus && lastFocus && lastFocus.focus) {
        lastFocus.focus({ preventScroll: true });
      }
    };

    openBtn.addEventListener('click', () => setOpen(!isOpen));
    closeBtn.addEventListener('click', () => setOpen(false));
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Enlaces a secciones: cerrar el menú y luego desplazarse
    $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', (e) => {
      if (a.hasAttribute('data-todo')) return;
      const hash = a.getAttribute('href');
      const target = hash.length > 1 && document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      setOpen(false, { restoreFocus: false });
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: smooth(), block: 'start' });
        history.pushState(null, '', hash);
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    }));

    mqMobile.addEventListener('change', (e) => { if (!e.matches) setOpen(false, { restoreFocus: false }); });
  })();

  /* =======================================================================
     10. WhatsApp
         Los enlaces con data-wa="texto" abren WhatsApp con ese texto.
         Mientras no haya número (FONDO.whatsapp), WhatsApp deja elegir a quién.
     ======================================================================= */
  const waUrl = (text) => `https://wa.me/${FONDO.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  $$('[data-wa]').forEach((a) => {
    a.href = waUrl(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* «Tengo otra pregunta»: al escribir y pulsar Enter abre WhatsApp con la pregunta */
  $$('form[data-ask]').forEach((form) => {
    const input = $('input', form);
    input.addEventListener('input', () => form.classList.toggle('has-text', !!input.value.trim()));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) { input.focus(); return; }
      window.open(waUrl(`Hola, una pregunta sobre el campamento de la Costa Brava: ${q}`), '_blank', 'noopener');
      input.value = '';
      form.classList.remove('has-text');
    });
  });

  /* =======================================================================
     11. Formulario «Lista de espera» (cajón lateral, dos pasos)
         Lo abre cualquier elemento con data-waitlist (y, con ratón, un clic
         en una zona data-waitlist-area). Se cierra con la X, Escape, clic
         fuera o «Lo dejo aquí». Paso 1: nombre, email y teléfono. Paso 2,
         opcional: tres preguntas. Por ahora no envía nada salvo que haya
         FONDO.formEndpoint.
     ======================================================================= */
  (() => {
    const wl = $('[data-wl]');
    if (!wl) return;
    const panel = $('.wl__panel', wl);
    const steps = $$('[data-wl-step]', wl);
    const form1 = $('[data-wl-form="1"]', wl), form2 = $('[data-wl-form="2"]', wl);
    const msg = $('.wl__msg', form1);
    const behind = [$('.page'), $('[data-header]'), $('.site-header--ink'), $('[data-dock-pill]')].filter(Boolean);
    let isOpen = false, lastFocus = null, finished = false;

    const show = (n) => {
      steps.forEach((s) => { s.hidden = s.dataset.wlStep !== String(n); });
      panel.scrollTop = 0;
    };
    const send = async (form, extra) => {
      if (!FONDO.formEndpoint) return;
      const data = new FormData(form); if (extra) data.append('paso', extra);
      const res = await fetch(FONDO.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
    };
    const setOpen = (open) => {
      if (open === isOpen) return;
      isOpen = open;
      if (open && finished) { form1.reset(); form2.reset(); finished = false; show(1); }
      wl.classList.toggle('is-open', open);
      wl.setAttribute('aria-hidden', String(!open));
      document.documentElement.classList.toggle('wl-open', open);
      behind.forEach((el) => { el.inert = open; });
      if (open) {
        lastFocus = document.activeElement;
        panel.scrollTop = 0;
        setTimeout(() => ($('[data-wl-step]:not([hidden]) input:not([type="hidden"])', wl) || panel).focus({ preventScroll: true }), 420);
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus({ preventScroll: true });
      }
    };

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-waitlist]');
      const area = !t && mqFine.matches && e.target.closest('[data-waitlist-area]');
      if (!t && !area) return;
      if (area && e.target.closest('a, button, input')) return;
      e.preventDefault();
      setOpen(true);
    });
    $$('[data-wl-close]', wl).forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('wl__skip')) finished = true;
      setOpen(false);
    }));
    wl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const f = $$('a[href], button:not([disabled]), input:not([type="hidden"]), textarea', wl).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Paso 1: validación campo a campo
    const required = $$('[required]', form1);
    const fieldOf = (input) => input.closest('label');
    const check = (input) => {
      const ok = input.type === 'checkbox' ? input.checked : input.value.trim() && input.checkValidity();
      fieldOf(input).classList.toggle('is-invalid', !ok);
      return !!ok;
    };
    required.forEach((input) => input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      if (fieldOf(input).classList.contains('is-invalid')) check(input);
      msg.textContent = '';
    }));
    form1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = required.filter((input) => !check(input));
      if (bad.length) {
        msg.textContent = bad.some((i) => i.type === 'email' && i.value.trim()) ? 'Revisa el email, parece que falta algo.' : 'Faltan los campos marcados con *.';
        bad[0].focus();
        return;
      }
      const btn = $('.wl__submit', form1);
      btn.disabled = true;
      try {
        await send(form1, 'lista');
        show(2);
        $('[data-wl-step="2"] .wl__title', wl).focus({ preventScroll: true });
      } catch (_) {
        msg.textContent = 'No se ha podido enviar. Vuelve a probar en un momento.';
      } finally { btn.disabled = false; }
    });

    // Paso 2: respuestas opcionales
    form2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('.wl__submit', form2);
      btn.disabled = true;
      try { await send(form2, 'preguntas'); } catch (_) { /* las respuestas son opcionales */ }
      btn.disabled = false;
      finished = true;
      setOpen(false);
      toast('Gracias por contárnoslo. Nos vemos en el fondo.');
    });

    if (location.hash === '#lista') setOpen(true);
  })();

  /* =======================================================================
     12. Óvalo del hero del viaje → botón fijo «Lista de espera»
         En el hero el óvalo sigue al ratón. Al bajar, «viaja» hasta la
         esquina inferior derecha y se queda ahí, siempre visible. Al volver
         arriba, regresa al hero.
     ======================================================================= */
  (() => {
    const hero = $('[data-dock-hero]');
    const pill = $('[data-dock-pill]');
    const oval = hero && $('.vhero__oval', hero);
    if (!hero || !pill || !oval) return;
    let docked = false;
    const dock = (v) => {
      if (v === docked) return;
      docked = v;
      const from = oval.getBoundingClientRect();
      const fly = v && parseFloat(getComputedStyle(oval).opacity) > 0.5 && from.bottom > 0 && !mqReduce.matches;
      oval.classList.toggle('is-docked', v);
      pill.style.transition = 'none';
      pill.classList.toggle('is-on', v);
      if (!fly) { pill.getBoundingClientRect(); pill.style.transition = ''; return; }
      const to = pill.getBoundingClientRect();
      pill.style.transformOrigin = '0 0';
      pill.style.transform = `translate(${(from.left - to.left).toFixed(1)}px, ${(from.top - to.top).toFixed(1)}px) scale(${(from.width / to.width).toFixed(3)})`;
      pill.getBoundingClientRect();
      pill.style.transition = 'transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)';
      pill.style.transform = '';
      setTimeout(() => { pill.style.transition = ''; pill.style.transformOrigin = ''; }, 750);
    };
    const check = () => dock(scrollY > Math.min(80, hero.offsetHeight * 0.1));
    addEventListener('scroll', () => requestAnimationFrame(check), { passive: true });
    check();
  })();

  /* =======================================================================
     13. Sobre nosotros: contador fijo 01 → 02 → 03
         Cambia con el principio que cruza el centro de la pantalla.
     ======================================================================= */
  (() => {
    const box = $('[data-counter]');
    if (!box) return;
    const reel = $('.sprin__num > span', box);
    const items = $$('[data-principle]');
    const set = (i) => { reel.style.transform = `translateY(${-0.9 * i}em)`; box.setAttribute('aria-label', `Principio ${i + 1} de ${items.length}`); };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    items.forEach((it) => io.observe(it));
    set(0);
  })();

  /* =======================================================================
     14. Cabecera que se esconde (como en Random Golf Club)
         Arriba del todo siempre se ve. Al bajar, acompaña un poco y se
         esconde. Al subir unos píxeles vuelve, y si no la usas se vuelve a
         esconder a los 2,5 s. Con el ratón encima, el foco dentro o el menú
         abierto se queda visible.
     ======================================================================= */
  (() => {
    const header = $('[data-header]');
    if (!header) return;
    const all = () => [header, $('.site-header--ink')].filter(Boolean);
    const root = document.documentElement;
    let lastY = scrollY, hidden = false, down = 0, up = 0, timer = 0;
    const TOP = 120, FOLLOW = 160, NUDGE = 6, IDLE = 2500;
    const set = (h) => { if (h === hidden) return; hidden = h; all().forEach((el) => el.classList.toggle('is-hidden', h)); };
    const busy = () => header.matches(':hover, :focus-within') || root.classList.contains('menu-open') || root.classList.contains('wl-open');
    const later = () => { clearTimeout(timer); timer = setTimeout(() => { if (scrollY > TOP && !busy()) set(true); }, IDLE); };
    addEventListener('scroll', () => {
      const y = scrollY, dy = y - lastY; lastY = y;
      if (y <= TOP) { set(false); clearTimeout(timer); down = up = 0; return; }
      if (busy()) return;
      if (dy > 0) { up = 0; down += dy; if (down > FOLLOW) { set(true); clearTimeout(timer); } }
      else if (dy < 0) { down = 0; up -= dy; if (up >= NUDGE) { set(false); later(); } }
    }, { passive: true });
    header.addEventListener('pointerleave', () => { if (!hidden && scrollY > TOP) later(); });
    header.addEventListener('focusin', () => set(false));
  })();

  /* =======================================================================
     15. Secuencia de fotos tipo gif (data-flipbook)
         Cambia de foto cada 450 ms, con corte seco. Solo corre cuando está
         a la vista; con «reducir movimiento» se queda en la primera.
     ======================================================================= */
  $$('[data-flipbook]').forEach((box) => {
    const imgs = $$('img', box);
    if (imgs.length < 2 || mqReduce.matches) return;
    let i = 0, timer = 0;
    const step = () => { imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) { imgs.forEach((im) => { im.loading = 'eager'; }); timer = setInterval(step, 450); }
    }, { rootMargin: '200px 0px' }).observe(box);
  });

  /* =======================================================================
     16. Manifiesto que se pinta con el scroll (data-fill)
         Cada palabra pasa de gris a negro a medida que el bloque cruza la
         pantalla: empieza cuando su parte de arriba llega al 85 % de la altura
         y termina cuando su parte de abajo llega al 45 %.
     ======================================================================= */
  $$('[data-fill]').forEach((sec) => {
    if (mqReduce.matches) return;
    const words = [];
    $$('.manifiesto__phrase', sec).forEach((ph) => {
      const parts = ph.textContent.trim().split(/\s+/);
      ph.textContent = '';
      parts.forEach((w, k) => {
        const s = document.createElement('span'); s.className = 'mf-w'; s.textContent = w;
        ph.appendChild(s); if (k < parts.length - 1) ph.appendChild(document.createTextNode(' '));
        words.push(s);
      });
    });
    sec.classList.add('is-filling');
    let shown = -1, ticking = false;
    const update = () => {
      ticking = false;
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      const start = vh * 0.85, end = vh * 0.45;
      const p = clamp((start - r.top) / ((start - end) + r.height), 0, 1);
      const n = Math.round(p * words.length);
      if (n === shown) return;
      shown = n;
      words.forEach((w, k) => w.classList.toggle('is-on', k < n));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  });

  /* =======================================================================
     17. Cómo viajamos: foto de la fila abierta y apertura con el scroll
         La foto de la izquierda cambia con la fila abierta. En desktop con
         pantalla alta, la sección se queda fija y cada paso de scroll (con
         snap suave) abre la fila siguiente; clic en una fila lleva a su paso.
     ======================================================================= */
  $$('[data-como]').forEach((sec) => {
    const acc = $('[data-accordion]', sec);
    const items = $$('.acc__item', acc);
    const pics = $$('.como__media img', sec);
    const n = items.length;
    const mqStageComo = matchMedia('(min-width: 900px) and (min-height: 760px)');
    const syncPic = () => {
      const i = items.findIndex((it) => it.classList.contains('is-open'));
      if (i < 0) return;
      pics.forEach((im, k) => im.classList.toggle('is-on', k === i));
    };
    new MutationObserver(syncPic).observe(acc, { subtree: true, attributes: true, attributeFilter: ['class'] });

    const openAt = (i) => {
      items.forEach((it, k) => {
        it.classList.toggle('is-open', k === i);
        $('.acc__head', it).setAttribute('aria-expanded', String(k === i));
      });
    };
    const range = () => sec.offsetHeight - innerHeight;
    const top = () => sec.getBoundingClientRect().top + scrollY;
    // Gris → negro al bajar: las filas ya «alcanzadas» pasan a negro
    sec.classList.add('is-reveal');
    const reach = (fn) => items.forEach((it, k) => it.classList.toggle('is-reached', fn(it, k)));
    let current = -1, ticking = false;
    const onScroll = () => {
      ticking = false;
      if (!mqStageComo.matches) {
        reach((it) => it.getBoundingClientRect().top < innerHeight * 0.75);
        return;
      }
      const p = clamp(-sec.getBoundingClientRect().top / range(), 0, 1);
      const i = Math.round(p * (n - 1));
      if (i !== current) { current = i; openAt(i); }
      reach((it, k) => k <= i && sec.getBoundingClientRect().top < innerHeight * 0.5);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll);
    mqStageComo.addEventListener('change', () => { current = -1; onScroll(); });
    onScroll();

    // En modo fijo, el clic en una fila lleva a su paso (en vez de abrir/cerrar)
    acc.addEventListener('click', (e) => {
      if (!mqStageComo.matches) return;
      const head = e.target.closest('.acc__head');
      if (!head) return;
      e.stopPropagation();
      const i = items.indexOf(head.closest('.acc__item'));
      scrollTo({ top: top() + (range() * i) / (n - 1), behavior: smooth() });
    }, true);
  });

  /* =======================================================================
     18. Sonidos desde el fondo (vinilo abajo a la izquierda)
         Nunca suena solo: al pasar por encima avisa y la primera vez que
         alguien entra el aviso asoma unos segundos. Pulsar el vinilo pone el
         audio (FONDO.audio, en bucle) y el vinilo gira; volver a pulsar lo para.
     ======================================================================= */
  (() => {
    const box = $('[data-sonido]');
    if (!box || !FONDO.audio) return;
    const btn = $('.sonido__btn', box);
    const audio = new Audio();
    audio.src = FONDO.audio; audio.loop = true; audio.preload = 'none';
    const setPlaying = (v) => {
      box.classList.toggle('is-playing', v);
      btn.setAttribute('aria-pressed', String(v));
      btn.setAttribute('aria-label', v ? 'Sonidos desde el fondo: parar la música' : 'Sonidos desde el fondo: poner música');
    };
    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    btn.addEventListener('click', () => {
      if (audio.paused) {
        const p = audio.play();
        if (p && p.catch) p.catch(() => { setPlaying(false); toast('El sonido llega muy pronto.'); });
      } else audio.pause();
    });

    // Aviso sutil la primera vez que alguien entra
    let seen = false; try { seen = sessionStorage.getItem('fondo-sonido-aviso') === '1'; } catch (_) {}
    if (!seen) setTimeout(() => {
      if (!audio.paused) return;
      box.classList.add('is-hint');
      setTimeout(() => box.classList.remove('is-hint'), 4000);
      try { sessionStorage.setItem('fondo-sonido-aviso', '1'); } catch (_) {}
    }, 6000);
  })();
})();
