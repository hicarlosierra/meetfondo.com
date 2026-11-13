/* =========================================================================
   FONDO · Landing v3 · Interacciones
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
    // Mapa del fotograma actual de un vídeo (se rehace como mucho cada 250 ms)
    const vmaps = new WeakMap();
    const lumMapVideo = (v) => {
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
      const nw = isVideo ? img.videoWidth : img.naturalWidth, nh = isVideo ? img.videoHeight : img.naturalHeight;
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
       el nuevo tono tiene que mantenerse 1,2 s antes de aplicarse: así el texto no
       parpadea con cada plano. */
    const HOLD = 1200;
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
    if (!v.getAttribute('src')) return;               // movimiento reducido o ahorro de datos: póster
    const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()), { threshold: 0.01 }).observe(v);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && v.getBoundingClientRect().bottom > 0) play(); });
  });

  /* =======================================================================
     2. «GIF» del faro: secuencia de fotos (1,5 s por foto, fundido 300 ms).
        Sustituible por <video autoplay muted loop playsinline>.
     ======================================================================= */
  $$('[data-slideshow]').forEach((box) => {
    const imgs = $$('img', box);
    if (imgs.length < 2) return;
    let i = 0, timer = null;
    const start = () => {
      if (timer || mqReduce.matches) return;
      timer = setInterval(() => {
        imgs[i].classList.remove('is-active');
        i = (i + 1) % imgs.length;
        imgs[i].classList.add('is-active');
      }, 1500);
    };
    const stop = () => { clearInterval(timer); timer = null; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(box);
  });

  /* =======================================================================
     3. Viajes
        Desktop: la sección se queda fija; cada paso de scroll activa el
        siguiente destino y mueve la tira de postales.
        Mobile / pantallas bajas: carrusel horizontal sincronizado con la lista.
     ======================================================================= */
  (() => {
    const sec = $('[data-viajes]');
    if (!sec) return;
    const items = $$('.viajes__item', sec);
    const strip = $('[data-strip]', sec);
    const cards = $$('.postal', strip);
    const n = items.length;
    let active = -1;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      items.forEach((b, k) => {
        b.classList.toggle('is-active', k === i);
        b.setAttribute('aria-current', k === i ? 'true' : 'false');
      });
      cards.forEach((c, k) => c.classList.toggle('is-current', k === i));
      strip.style.setProperty('--i', i);
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

    const goTo = (i) => {
      if (mqStage.matches) {
        scrollTo({ top: secTop() + (range() * i) / (n - 1), behavior: smooth() });
      } else {
        const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
        strip.scrollTo({ left: cards[i].offsetLeft - pad, behavior: smooth() });
        setActive(i);
      }
    };
    items.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
    cards.forEach((c, i) => c.addEventListener('focus', () => { if (mqStage.matches && i !== active) goTo(i); }));

    const io = new IntersectionObserver((entries) => {
      if (mqStage.matches) return;
      entries.forEach((e) => { if (e.isIntersecting) setActive(cards.indexOf(e.target)); });
    }, { root: strip, threshold: 0.6 });
    cards.forEach((c) => io.observe(c));

    mqStage.addEventListener('change', () => { strip.scrollLeft = 0; onScroll(); });
  })();

  /* =======================================================================
     4. Óvalos que aparecen con el cursor (postales, guía y footer)
        No están a la vista: al entrar en su zona aparecen bajo el puntero,
        lo siguen con un poco de retardo y desaparecen al salir.
        En táctil quedan fijos como sello (lo resuelve el CSS).
        En el footer, sobre un enlace, el óvalo muestra el nombre del enlace.
     ======================================================================= */
  $$('[data-follow-area]').forEach((area) => {
    const el = $('[data-follow]', area);
    if (!el) return;
    const label = el.querySelector('span');
    const defaultHTML = label ? label.innerHTML : '';
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, inside = false, hideTimer = 0;

    const paint = () => { el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`; };
    const tick = () => {
      const k = mqReduce.matches ? 1 : 0.22;
      cx = lerp(cx, tx, k); cy = lerp(cy, ty, k); paint();
      raf = inside && (Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2) ? requestAnimationFrame(tick) : 0;
    };
    const target = (e) => {
      const r = el.getBoundingClientRect();           // el escalado no mueve el centro
      tx = e.clientX - (r.left - cx + r.width / 2);
      ty = e.clientY - (r.top - cy + r.height / 2);
    };

    area.addEventListener('pointerenter', (e) => {
      if (!isMouse(e)) return;
      clearTimeout(hideTimer);
      inside = true;
      target(e); cx = tx; cy = ty; paint();          // aparece justo bajo el puntero
      area.classList.add('has-cursor');
      requestAnimationFrame(() => el.classList.add('is-visible'));
    });
    area.addEventListener('pointermove', (e) => {
      if (!inside || !isMouse(e)) return;
      target(e);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    area.addEventListener('pointerleave', () => {
      if (!inside) return;
      inside = false;
      el.classList.remove('is-visible');            // desaparece donde está
      area.classList.remove('has-cursor');
      hideTimer = setTimeout(() => {
        if (inside) return;
        cx = cy = tx = ty = 0; el.style.transform = '';
        if (label) label.innerHTML = defaultHTML;
      }, 380);
    });

    if (el.hasAttribute('data-cursor-default') && label) {
      area.addEventListener('pointerover', (e) => {
        const a = e.target.closest('a, button');
        if (a && area.contains(a) && inside) label.textContent = a.textContent.trim();
      });
      area.addEventListener('pointerout', (e) => {
        const a = e.target.closest('a, button');
        if (a && !a.contains(e.relatedTarget)) label.innerHTML = defaultHTML;
      });
    }
  });

  /* =======================================================================
     5. Manifiesto: tres frases, tres fotos.
        Con ratón: la foto aparece al entrar en la zona, sigue al puntero y
        cambia con la frase que pisas. Al salir, desaparece.
        Sin ratón: la frase que cruza el centro de la pantalla se activa y la
        foto (fija debajo del texto) cambia con ella.
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

    const paint = () => { photo.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`; };
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

    mqFine.addEventListener('change', () => { photo.style.transform = ''; photo.classList.remove('is-visible'); });
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
         Se arrastra con el dedo o el trackpad (scroll-snap) y, en desktop,
         con las flechas. Las flechas se apagan en los extremos.
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
    const behind = [$('.page'), $('[data-header]'), $('.site-header--ink')].filter(Boolean);
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

    openBtn.addEventListener('click', () => setOpen(true));
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
})();
