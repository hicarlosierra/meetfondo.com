/* ==========================================================================
   FONDO · LOADER (integrado en la landing)
   Origen: fondo-loader-fragmento.html (Carlos). Motor sin cambios; solo cambia
   la configuración (bloque 1) y se añade el bloque 4, que lo conecta con la web.

   Secuencia: «fondo» en reposo → se transforma en el ánfora → el ánfora se
   asienta → el panel sube como un telón y el hero entra a la vez.
   Si la página tarda más en cargar, el logo sigue transformándose hasta que
   esté lista (como mucho MAX_WAIT segundos) y sale siempre desde el ánfora.
   ========================================================================== */
/* ==========================================================================
   FONDO · LOADER — 1 · CONFIGURACIÓN
   Todo lo que se puede tocar sin leer el resto del archivo.
   Las medidas del efecto van en unidades del viewBox del logo (0–400).
   ========================================================================== */
window.FONDO_LOADER_CONFIG = {

  /* --- Aspecto --------------------------------------------------------- */
  theme: 'fondo',                        // 'fondo' (tokens de la web) | 'blue' | 'beige' | 'transparent' | { background, logo }
  themes: {
    fondo:       { background: 'var(--beige)', logo: 'var(--azul)' },   // #FAF3EB y #1E57B1, los de la web
    blue:        { background: '#20449C',     logo: '#FFFFFF' },
    beige:       { background: '#F5F4F2',     logo: '#20449C' },
    transparent: { background: 'transparent', logo: '#FFFFFF' }   // para superponerlo sobre cualquier color
  },
  logoSize: 'clamp(176px, 34vmin, 340px)',  // lado del cuadrado del logo (cualquier medida CSS)

  /* --- Tiempos (segundos) ---------------------------------------------- */
  durations: {
    wordmark:   0.6,                     // "fondo" en reposo (lo justo para leerlo)
    toIsotype:  1.2,                     // fondo → ánfora
    isotype:    1.2,                     // ánfora en reposo
    toWordmark: 1.2                      // ánfora → fondo
  },
  easing: 'expo.inOut',                  // 'expo.inOut' | 'quint.inOut' | 'quart.inOut' | 'cubic.inOut' | 'sine.inOut' | function (t) { return t; }

  /* --- Efecto líquido (solo existe durante la transición; en reposo vale 0) --- */
  blur: 9,                               // desenfoque máximo del filtro gooey
  distortion: 6,                         // refracción máxima (feTurbulence + feDisplacementMap). 0 = desactivada
  flow: 4,                               // deriva de los contornos, como si los moviera el agua
  swirl: 25,                             // grados de giro horario durante la transición, tipo remolino (el centro gira menos que el anillo). 0 = sin giro
  stagger: 0.22,                         // 0–0.6 · cuánto se adelanta lo de fuera (anillo) a lo del centro (ánfora)
  breath: 0.012,                         // respiración en reposo: 0.012 = +1,2 % de escala. 0 = quieto del todo

  /* --- Comportamiento como loader -------------------------------------- */
  mode: 'loader',                          // 'loader' (producción) | 'demo' (botones de prueba) | 'loop' (bucle limpio para grabar)
  autoHide: true,                        // true: se oculta solo cuando la página termina de cargar (window.load)
  minVisible: 2.15,                      // 0,6 «fondo» + 1,2 transformación + 0,35 para que el ánfora se asiente
  endOn: 'isotype',                      // termina siempre en el ánfora: el gesto es «fondo» → ánfora → telón
  exit: { type: 'slide', duration: 1.0, delay: 0.2 },   // salida del panel: 'slide' (sube como un telón) | 'fade'
  reducedMotion: 'auto',                 // 'auto' respeta prefers-reduced-motion · true/false lo fuerza
  lockScroll: true                       // bloquea el scroll de la página mientras el loader está visible
};

/* ==========================================================================
   FONDO · LOADER — 3 · MOTOR
   Lee los paths originales del SVG de arriba, los trocea en piezas que se
   corresponden entre "fondo" y el isotipo, y las interpola dentro de un
   filtro líquido. En reposo se muestran los paths originales, sin filtro.

   API:  fondoLoader.hide()  → Promise   termina la transición en curso y sale
         fondoLoader.show()              vuelve a mostrarlo desde el principio
         fondoLoader.play() / pause() / seek(segundos) / set({ ...config })
   Eventos en document: 'fondoloader:hide' (empieza a salir) y 'fondoloader:hidden'
   ========================================================================== */
(function (win, doc) {
  'use strict';

  var root = doc.getElementById('fondo-loader');
  if (!root) return;

  /* ---------- Configuración ---------- */
  var DEFAULTS = {
    theme: 'blue',
    themes: {
      blue: { background: '#20449C', logo: '#FFFFFF' },
      beige: { background: '#F5F4F2', logo: '#20449C' },
      transparent: { background: 'transparent', logo: '#FFFFFF' }
    },
    logoSize: 'clamp(176px, 34vmin, 340px)',
    durations: { wordmark: 1.2, toIsotype: 1.2, isotype: 1.2, toWordmark: 1.2 },
    easing: 'expo.inOut',
    blur: 9, distortion: 6, flow: 4, swirl: 25, stagger: 0.22, breath: 0.012,
    mode: 'loader', autoHide: false, minVisible: 0, endOn: 'next',
    exit: { type: 'slide', duration: 0.9, delay: 0.2 },
    reducedMotion: 'auto', lockScroll: true
  };
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(a, b) {
    var o = {}, k;
    for (k in a) o[k] = a[k];
    for (k in b) o[k] = (isObj(b[k]) && isObj(a[k])) ? merge(a[k], b[k]) : b[k];
    return o;
  }
  var C = merge(DEFAULTS, win.FONDO_LOADER_CONFIG || {});

  var EASE = {
    // expo.inOut normalizada: vale exactamente 0 y 1 en los extremos (la clásica arranca con un saltito)
    'expo.inOut': function (t) {
      var z = 1 / 1024, e = t < 0.5 ? Math.pow(2, 20 * t - 10) : 2 - Math.pow(2, 10 - 20 * t);
      return t <= 0 ? 0 : t >= 1 ? 1 : (e - z) / (2 - 2 * z);
    },
    'quint.inOut': function (t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(2 - 2 * t, 5) / 2; },
    'quart.inOut': function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(2 - 2 * t, 4) / 2; },
    'cubic.inOut': function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2; },
    'sine.inOut': function (t) { return 0.5 - Math.cos(Math.PI * t) / 2; }
  };
  function ease(t) { return (typeof C.easing === 'function' ? C.easing : (EASE[C.easing] || EASE['expo.inOut']))(t); }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function bell(t, k) { return Math.pow(Math.sin(Math.PI * clamp01(t)), k); }   // 0 en los extremos, 1 en el centro

  /* ---------- DOM ---------- */
  var svg = root.querySelector('.fl-logo');
  var stage = svg.querySelector('.fl-stage');
  var gWord = svg.querySelector('.fl-word');
  var gIso = svg.querySelector('.fl-iso');
  var gMorph = svg.querySelector('.fl-morph');
  var feDisp = svg.querySelector('feDisplacementMap');
  var feBlur = svg.querySelector('feGaussianBlur');
  var feGoo = svg.querySelector('feColorMatrix');

  /* ======================================================================
     GEOMETRÍA
     ====================================================================== */
  var FLATTEN = 0.02;   // error máximo al convertir curvas en segmentos (unidades del viewBox)
  var MAXSEG = 3;       // longitud máxima de segmento tras remuestrear: da puntos de sobra para que fluya
  var OVERLAP = 6;      // solape entre piezas vecinas del anillo, para que no se vea la junta

  // "M … L … C …" → lista de contornos cerrados [[x, y], …]
  function parsePath(d) {
    var tok = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi), i = 0, subs = [], cur, cx = 0, cy = 0, cmd;
    function num() { return parseFloat(tok[i++]); }
    while (i < tok.length) {
      if (/[MLCZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
      if (cmd === 'M') { cx = num(); cy = num(); cur = [[cx, cy]]; subs.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { cx = num(); cy = num(); cur.push([cx, cy]); }
      else if (cmd === 'C') {
        var x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
        var bend = Math.max(Math.hypot(cx - 2 * x1 + x2, cy - 2 * y1 + y2), Math.hypot(x1 - 2 * x2 + x, y1 - 2 * y2 + y));
        var n = Math.max(1, Math.min(40, Math.ceil(Math.sqrt(0.75 * bend / FLATTEN))));
        for (var k = 1; k <= n; k++) {
          var t = k / n, m = 1 - t;
          cur.push([m * m * m * cx + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x,
                    m * m * m * cy + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y]);
        }
        cx = x; cy = y;
      }
    }
    return subs.map(function (s) {
      var o = [];
      s.forEach(function (p) { var q = o[o.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6) o.push(p); });
      if (o.length > 1 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 1e-6) o.pop();
      return o;
    });
  }
  // índice del vértice más cercano a (x, y), opcionalmente dentro de [a, b)
  function near(c, x, y, a, b) {
    var bi = a || 0, bd = 1e18;
    for (var i = a || 0, e = b || c.length; i < e; i++) { var dx = c[i][0] - x, dy = c[i][1] - y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bi = i; } }
    return bi;
  }
  // tramo del contorno del vértice i al j, avanzando
  function walk(c, i, j) { var o = [c[i]], k = i; while (k !== j) { k = (k + 1) % c.length; o.push(c[k]); } return o; }
  // vuelta completa empezando (y acabando) en el vértice i
  function loopFrom(c, i) { var o = []; for (var k = 0; k <= c.length; k++) o.push(c[(i + k) % c.length]); return o; }
  // avanza (o retrocede) una distancia a lo largo del contorno
  function advance(c, i, dist) {
    var n = c.length, k = i, acc = 0, dir = dist < 0 ? -1 : 1; dist = Math.abs(dist);
    while (acc < dist) { var k2 = (k + dir + n) % n; acc += Math.hypot(c[k2][0] - c[k][0], c[k2][1] - c[k][1]); k = k2; }
    return k;
  }
  // corta un contorno cerrado en tramos entre puntos de referencia
  function sections(c, marks) {
    var idx = marks.map(function (m) { return near(c, m[0], m[1]); }), out = [];
    for (var k = 0; k < idx.length; k++) out.push(walk(c, idx[k], idx[(k + 1) % idx.length]));
    return out;
  }
  function cum(p) { var L = [0]; for (var i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return L; }
  function at(p, L, s) {
    var n = p.length; if (n === 1 || s <= 0) return p[0]; if (s >= L[n - 1]) return p[n - 1];
    var lo = 0, hi = n - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
    var f = (s - L[lo]) / ((L[hi] - L[lo]) || 1);
    return [p[lo][0] + (p[hi][0] - p[lo][0]) * f, p[lo][1] + (p[hi][1] - p[lo][1]) * f];
  }
  // Empareja dos tramos por longitud de arco. Conserva TODOS los vértices de los dos lados
  // (los puntos nuevos caen sobre las aristas), así que en t = 0 y t = 1 la silueta es
  // exactamente la del dibujo original.
  function matchSection(A, B, S, T) {
    var LA = cum(A), LB = cum(B), a = LA[LA.length - 1], b = LB[LB.length - 1], us = [0, 1], i;
    if (a > 0) for (i = 0; i < LA.length; i++) us.push(LA[i] / a);
    if (b > 0) for (i = 0; i < LB.length; i++) us.push(LB[i] / b);
    us.sort(function (x, y) { return x - y; });
    var u = [us[0]]; for (i = 1; i < us.length; i++) if (us[i] - u[u.length - 1] > 1e-7) u.push(us[i]);
    for (i = 0; i < u.length - 1; i++) {
      var a0 = at(A, LA, u[i] * a), a1 = at(A, LA, u[i + 1] * a), b0 = at(B, LB, u[i] * b), b1 = at(B, LB, u[i + 1] * b);
      var n = Math.max(1, Math.ceil(Math.max(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), Math.hypot(b1[0] - b0[0], b1[1] - b0[1])) / MAXSEG));
      for (var j = 0; j < n; j++) {
        var f = j / n;
        S.push(a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f);
        T.push(b0[0] + (b1[0] - b0[0]) * f, b0[1] + (b1[1] - b0[1]) * f);
      }
    }
  }
  function matchLoop(src, tgt) {
    if (src.length !== tgt.length) throw new Error('fondoLoader: tramos desparejados (' + src.length + '/' + tgt.length + ')');
    var S = [], T = [];
    for (var k = 0; k < src.length; k++) matchSection(src[k], tgt[k], S, T);
    return { S: S, T: T };
  }

  /* ======================================================================
     COREOGRAFÍA · qué trozo de "fondo" se convierte en qué trozo del isotipo

        f  →  arco del anillo de las 9 a las 12
        n  →  arco de las 12 a las 3 (las dos patas se abren)
        o  (abajo) → arco de las 3 a las 6: la "o" se corta y se desenrolla
        d  →  una "U": el asta es el cuerpo de la ánfora y la panza es el arco
              de las 6 a las 9. Su contraforma se abre y pasa a ser el aire
              que queda entre la ánfora y el anillo.
        o  (arriba) → cuello, boca y asas; su contraforma es el ojo del asa
        piedras → nacen al final, cuando el líquido ya se está asentando

     Las coordenadas son puntos de referencia de los dos SVG originales
     (viewBox 0 0 400 400). Si se redibujan los logos hay que revisarlas.
     ====================================================================== */
  function buildPieces() {
    var wp = gWord.querySelectorAll('path'), ip = gIso.querySelectorAll('path');
    var W0 = parsePath(wp[0].getAttribute('d')), W1 = parsePath(wp[1].getAttribute('d'));   // "do" · "fon"
    var I0 = parsePath(ip[0].getAttribute('d')), I1 = parsePath(ip[1].getAttribute('d'));   // piedras · anillo + ánfora
    var o2 = W0[0], d = W0[1], o2c = W0[2], dc = W0[3];
    var n = W1[0], f = W1[1], o1 = W1[2], o1c = W1[4];
    var RO = I1[0];        // borde exterior del anillo (sentido horario)
    var RI = I1[1];        // borde interior del anillo + silueta de la ánfora (antihorario)
    var HH = I1[2];        // hueco del asa izquierda
    var pieces = [];

    // cortes del anillo, como en un reloj
    var cut = {
      12: { o: near(RO, 213, 21), i: near(RI, 213, 61.5) },
      3: { o: near(RO, 365.5, 214), i: near(RI, 323, 214) },
      6: { o: near(RO, 245, 366.6), i: near(RI, 244, 331.5, 0, 60) },
      9: { o: near(RO, 37, 212), i: near(RI, 73.5, 212) }
    };
    // arco entre dos cortes: borde exterior, tapa, borde interior de vuelta, tapa
    function arc(a, b) {
      var o0 = advance(RO, cut[a].o, -OVERLAP), o1_ = advance(RO, cut[b].o, OVERLAP);
      var i0 = advance(RI, cut[b].i, -OVERLAP), i1 = advance(RI, cut[a].i, OVERLAP);
      return [walk(RO, o0, o1_), [RO[o1_], RI[i0]], walk(RI, i0, i1), [RI[i1], RO[o0]]];
    }

    // f → arco 9–12 · pie del asta ↔ corte de las 9, punta de la bandera ↔ corte de las 12
    pieces.push({ name: 'f', loops: [matchLoop(
      sections(f, [[83.34, 188.6], [159.98, 38.94], [160.9, 47.95], [115.35, 189.84]]),
      arc(9, 12))] });

    // n → arco 12–3 · cabeza del asta ↔ corte de las 12, pie derecho ↔ corte de las 3
    pieces.push({ name: 'n', loops: [matchLoop(
      sections(n, [[278.79, 87.38], [354.81, 195.43], [335.42, 187.04], [262.48, 91.41]]),
      arc(12, 3))] });

    // o (abajo) → arco 3–6 · corte mirando al centro; fuera ↔ borde exterior, contraforma ↔ borde interior
    var po = near(o2, 253.05, 260.19), pc = near(o2c, 276.48, 286.34);
    pieces.push({ name: 'o-bottom', loops: [matchLoop(
      [loopFrom(o2, po), [o2[po], o2c[pc]], loopFrom(o2c, pc), [o2c[pc], o2[po]]],
      arc(3, 6))] });

    // d → cuerpo de la ánfora + arco 6–9
    var foot = near(RI, 133.73, 325.29);                             // pie izquierdo de la ánfora
    var aL = near(RI, 149, 214, foot, foot + 120);                   // hombro izquierdo
    var aR = near(RI, 246, 214, RI.length - 120, RI.length);         // hombro derecho
    var i6 = advance(RI, cut[6].i, OVERLAP), o6 = advance(RO, cut[6].o, -OVERLAP);
    var o9 = advance(RO, cut[9].o, OVERLAP), i9 = advance(RI, cut[9].i, -OVERLAP);
    var dTL = near(d, 161.9, 209.56), dTR = near(d, 206.62, 209.56), dBR = near(d, 219.17, 361.86);
    var dPo = near(d, 154.32, 234.88), dPc = near(dc, 149.72, 272), dCB = near(dc, 148.05, 324.73);
    pieces.push({ name: 'd', loops: [matchLoop([
      walk(d, dTL, dTR),                                             // cabeza del asta
      walk(d, dTR, dBR),                                             // lado derecho del asta
      walk(d, dBR, dPo),                                             // pie + panza por fuera
      [d[dPo], dc[dPc]],                                             // corte donde la panza toca el asta
      walk(dc, dPc, dCB),                                            // contraforma: arriba, izquierda y abajo
      walk(dc, dCB, dPc).concat(walk(d, dPo, dTL))                   // contraforma derecha + corte + asta
    ], [
      [RI[aL], RI[aR]],                                              // hombros (queda tapado por la otra pieza)
      walk(RI, aR, RI.length - 1).concat(walk(RI, 0, i6), [RO[o6]]), // lado derecho de la ánfora + tapa de las 6
      walk(RO, o6, o9),                                              // borde exterior 6 → 9
      [RO[o9], RI[i9]],                                              // tapa de las 9
      walk(RI, i9, foot),                                            // borde interior 9 → pie de la ánfora
      walk(RI, foot, aL)                                             // lado izquierdo de la ánfora
    ])] });

    // o (arriba) → parte alta de la ánfora, con su contraforma como hueco del asa
    var bL = near(RI, 149, 230, foot, foot + 120), bR = near(RI, 250.7, 230, RI.length - 120, RI.length);
    var top = walk(RI, bL, bR);
    pieces.push({ name: 'o-top', loops: [
      matchLoop(
        sections(o1, [[151.36, 183.94], [129.51, 155.69], [176.91, 97.93], [238.77, 119.98], [245.55, 137.99], [223.69, 168.11], [200.61, 184.25]]),
        sections(top, [top[0], [143.97, 174.21], [189.37, 104.89], [263.43, 122.32], [284.66, 175.1], [258.5, 238.6], top[top.length - 1]])),
      matchLoop(
        sections(o1c, [[183.99, 119.98], [178.75, 166.86]]),
        sections(HH, [[182.28, 151.53], [166, 206.76]]))
    ] });

    // piedras
    I0.forEach(function (s, k) {
      var cx = 0, cy = 0, T = [];
      s.forEach(function (p) { cx += p[0]; cy += p[1]; T.push(p[0], p[1]); });
      pieces.push({ name: 'stone-' + k, stone: true, cx: cx / s.length, cy: cy / s.length, loops: [{ S: T, T: T }] });
    });
    return pieces;
  }

  var pieces = [], pointCount = 0;
  function setup() {
    pieces = buildPieces();
    pieces.forEach(function (p) {
      p.el = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      gMorph.appendChild(p.el);
      p.loops.forEach(function (l) {
        var n = l.S.length / 2; pointCount += n;
        l.S = new Float32Array(l.S); l.T = new Float32Array(l.T); l.D = new Float32Array(n);
        // desfase de cada punto: lo que está lejos del centro arranca antes
        for (var i = 0; i < n; i++) {
          var mx = (l.S[2 * i] + l.T[2 * i]) / 2 - 200, my = (l.S[2 * i + 1] + l.T[2 * i + 1]) / 2 - 200;
          l.D[i] = 1 - Math.min(1, Math.hypot(mx, my) / 180);
        }
      });
    });
  }

  /* ======================================================================
     RENDER
     ====================================================================== */
  var S = { T: 0, playing: true, speed: 1, visible: true, leaving: false, stop: null, shownAt: 0, debug: false };
  var unitPx = 1, shown = '';

  function reduced() {
    return C.reducedMotion === true || (C.reducedMotion === 'auto' && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function measure() { unitPx = svg.getBoundingClientRect().width / 400 * (win.devicePixelRatio || 1); }
  function r2(v) { return Math.round(v * 100) / 100; }

  function phases() {
    var d = C.durations;
    return [['wordmark', d.wordmark], ['toIsotype', d.toIsotype], ['isotype', d.isotype], ['toWordmark', d.toWordmark]];
  }
  function cycle() { var d = C.durations; return (d.wordmark + d.toIsotype + d.isotype + d.toWordmark) || 1; }
  function phaseAt(T) {
    var ph = phases(), c = cycle(), t = ((T % c) + c) % c, acc = 0;
    for (var i = 0; i < 4; i++) {
      if (t < acc + ph[i][1] || i === 3) return { name: ph[i][0], rest: i % 2 === 0, u: ph[i][1] > 0 ? clamp01((t - acc) / ph[i][1]) : 1 };
      acc += ph[i][1];
    }
  }

  function display(which) {
    if (shown === which) return; shown = which;
    gWord.style.display = (which === 'word' || which === 'both') ? 'inline' : 'none';
    gIso.style.display = (which === 'iso' || which === 'both') ? 'inline' : 'none';
    gMorph.style.display = which === 'morph' ? 'inline' : 'none';
    if (which !== 'both') { gWord.style.opacity = ''; gIso.style.opacity = ''; }
  }

  // tau: avance lineal de la transición (0–1) · forward: fondo → ánfora
  // Giro: durante la transición el conjunto da un cuarto de remolino en sentido horario.
  // No es una rotación rígida: cada punto gira según su distancia al centro (el anillo
  // gira entero, el centro apenas), como un remolino en el agua. Para llegar exactamente
  // al dibujo final, el destino se pre-gira en sentido contrario y el giro lo deshace.
  var SWIRL_RADIUS = 160;                  // radio (viewBox) a partir del cual el giro es completo
  function swirlWeight(x, y) { var r = Math.hypot(x - 200, y - 200) / SWIRL_RADIUS; return r > 1 ? 1 : r; }
  function rot(x, y, a, out) { var c = Math.cos(a), s = Math.sin(a), dx = x - 200, dy = y - 200; out[0] = 200 + dx * c - dy * s; out[1] = 200 + dx * s + dy * c; }

  function renderMorph(tau, forward, time) {
    var D = Math.min(0.9, C.stagger), flow = C.flow * bell(tau, 1.2), q = forward ? tau : 1 - tau;
    var theta = (C.swirl || 0) * Math.PI / 180;
    var phi = theta * (0.5 - Math.cos(Math.PI * tau) / 2);     // avance del giro: 0 → theta, suave en los dos extremos
    var tmp = [0, 0], tmp2 = [0, 0];
    for (var p = 0; p < pieces.length; p++) {
      var pc = pieces[p], str = '', i, x, y, w;
      if (pc.stone) {
        // las piedras crecen desde su centro en el último tercio (y se encogen en el primero a la vuelta)
        var g = clamp01((q - 0.6) / 0.38); g = 1 - Math.pow(1 - g, 3);
        if (g > 0.02) {
          var P = pc.loops[0].T, sa = forward ? phi - theta : phi;   // nacen pre-giradas y acaban en su sitio
          for (i = 0; i < P.length; i += 2) {
            x = pc.cx + (P[i] - pc.cx) * g; y = pc.cy + (P[i + 1] - pc.cy) * g;
            if (theta) { rot(x, y, sa * swirlWeight(x, y), tmp); x = tmp[0]; y = tmp[1]; }
            str += (i ? 'L' : 'M') + r2(x) + ' ' + r2(y);
          }
          str += 'Z';
        }
        pc.el.setAttribute('d', str);
        continue;
      }
      for (var l = 0; l < pc.loops.length; l++) {
        var L = pc.loops[l], A = forward ? L.S : L.T, B = forward ? L.T : L.S, Dl = L.D, n = Dl.length;
        for (i = 0; i < n; i++) {
          var e = ease(clamp01((tau - D * Dl[i]) / (1 - D)));
          var bx = B[2 * i], by = B[2 * i + 1];
          if (theta) { rot(bx, by, -theta * swirlWeight(bx, by), tmp2); bx = tmp2[0]; by = tmp2[1]; }
          x = A[2 * i] + (bx - A[2 * i]) * e; y = A[2 * i + 1] + (by - A[2 * i + 1]) * e;
          if (theta) { rot(x, y, phi * swirlWeight(x, y), tmp); x = tmp[0]; y = tmp[1]; }
          if (flow) {
            // deriva: un campo suave de ondas lentas que arrastra los contornos
            x += flow * (Math.sin(0.021 * y + 1.7 * time + 1.3) + 0.5 * Math.sin(0.043 * x - 1.1 * time + 4.1)) / 1.5;
            y += flow * (Math.sin(0.019 * x - 1.3 * time + 2.6) + 0.5 * Math.sin(0.047 * y + 0.9 * time + 0.4)) / 1.5;
          }
          str += (i ? 'L' : 'M') + r2(x) + ' ' + r2(y);
        }
        str += 'Z';
      }
      pc.el.setAttribute('d', str);
    }
  }

  function render() {
    var ph = phaseAt(S.T);

    if (reduced()) {                         // movimiento reducido: fundido simple entre los dos dibujos
      display('both'); stage.removeAttribute('transform');
      var a = ph.rest ? (ph.name === 'wordmark' ? 0 : 1) : (ph.name === 'toIsotype' ? ph.u : 1 - ph.u);
      a = a * a * (3 - 2 * a);
      gWord.style.opacity = 1 - a; gIso.style.opacity = a;
      return;
    }

    if (ph.rest) {                           // reposo: paths originales, sin filtro, con una respiración mínima
      display(ph.name === 'wordmark' ? 'word' : 'iso');
      var s = 1 + C.breath * Math.pow(Math.sin(Math.PI * ph.u), 2);
      stage.setAttribute('transform', 'matrix(' + s + ' 0 0 ' + s + ' ' + 200 * (1 - s) + ' ' + 200 * (1 - s) + ')');
      return;
    }

    display('morph');                        // transición: piezas interpoladas dentro del filtro líquido
    stage.removeAttribute('transform');
    var b = bell(ph.u, 1.4), sigma = C.blur * b, disp = C.distortion * b;
    if (S.debug || (sigma < 0.01 && disp < 0.01)) gMorph.removeAttribute('filter');
    else {
      // El umbral vuelve a afilar lo que el blur ablanda. La pendiente se calcula para que el borde
      // conserve el mismo antialiasing que sin filtro: con sigma → 0 la matriz es la identidad.
      var px = sigma * unitPx / 0.32, k = Math.sqrt(1 + px * px);
      feBlur.setAttribute('stdDeviation', sigma.toFixed(3));
      feBlur.setAttribute('in', disp > 0.01 ? 'disp' : 'SourceGraphic');
      feDisp.setAttribute('scale', disp.toFixed(3));
      feGoo.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ' + k.toFixed(3) + ' ' + (0.5 * (1 - k)).toFixed(3));
      gMorph.setAttribute('filter', 'url(#fl-liquid)');
    }
    renderMorph(ph.u, ph.name === 'toIsotype', S.T);
  }

  /* ======================================================================
     BUCLE, ENTRADA Y SALIDA
     ====================================================================== */
  var raf = 0, last = 0, hideTimer = 0, leaveTimer = 0, hidePromise = null, resolveHide = null;

  function tick(now) {
    raf = 0;
    if (!S.visible) return;
    var dt = Math.min(0.1, Math.max(0, now - last) / 1000) * S.speed; last = now;
    if (S.playing) {
      S.T += dt;
      if (S.stop) {
        if (S.T >= S.stop.hold) S.T = S.stop.hold;
        if (!S.leaving && S.T >= S.stop.exitAt) leave();
      }
      render();
    }
    raf = win.requestAnimationFrame(tick);
  }
  function start() { if (!raf) { last = win.performance.now(); raf = win.requestAnimationFrame(tick); } }
  function emit(name) { doc.dispatchEvent(new win.CustomEvent(name)); }
  function theme() { return (typeof C.theme === 'string' ? C.themes[C.theme] : C.theme) || C.themes.blue; }

  function applyLook() {
    var t = theme();
    root.style.setProperty('--fl-bg', t.background);
    root.style.setProperty('--fl-fg', t.logo);
    root.style.setProperty('--fl-size', C.logoSize);
    measure();
  }

  // busca el próximo reposo en el que detenerse
  function planStop() {
    var d = C.durations, c = cycle(), base = Math.floor(S.T / c) * c, k, list = [];
    for (k = 0; k < 3; k++) {
      if (C.endOn !== 'isotype') list.push([base + k * c, base + k * c + d.wordmark]);
      if (C.endOn !== 'wordmark') list.push([base + k * c + d.wordmark + d.toIsotype, base + k * c + d.wordmark + d.toIsotype + d.isotype]);
    }
    list.sort(function (a, b) { return a[0] - b[0]; });
    for (k = 0; k < list.length; k++) {
      var s = list[k][0], e = list[k][1], hold = Math.max(s, e - 0.002);
      if (S.T <= hold) {
        // si ya está en reposo sale enseguida; si viene de una transición, deja que el logo se asiente un instante
        return { hold: hold, exitAt: S.T >= s ? S.T : Math.min(hold, s + C.exit.delay) };
      }
    }
    return { hold: S.T, exitAt: S.T };
  }

  function leave() {
    S.leaving = true;
    var fade = reduced() || C.exit.type === 'fade' || theme().background === 'transparent';
    var dur = reduced() ? Math.min(0.4, C.exit.duration) : C.exit.duration;
    root.style.setProperty('--fl-exit', dur + 's');
    root.classList.add(fade ? 'fl--fade' : 'fl--slide');
    void root.offsetWidth;
    root.classList.add('is-leaving');
    emit('fondoloader:hide');
    leaveTimer = win.setTimeout(finish, dur * 1000 + 80);
  }
  function finish() {
    win.clearTimeout(hideTimer); win.clearTimeout(leaveTimer);
    S.visible = false; S.leaving = false; S.stop = null;
    root.hidden = true; root.setAttribute('aria-hidden', 'true');
    root.classList.remove('is-leaving', 'fl--fade', 'fl--slide');
    doc.documentElement.classList.remove('fl-lock');
    emit('fondoloader:hidden');
    if (resolveHide) resolveHide();
    hidePromise = resolveHide = null;
  }

  function hide(opts) {
    if (!S.visible) return Promise.resolve();
    if (!hidePromise) hidePromise = new Promise(function (res) { resolveHide = res; });
    var p = hidePromise;
    if (opts && opts.immediate) { finish(); return p; }
    if (S.stop || S.leaving) return p;
    win.clearTimeout(hideTimer);
    hideTimer = win.setTimeout(function () {
      S.playing = true; S.stop = planStop(); start();
    }, Math.max(0, C.minVisible * 1000 - (win.performance.now() - S.shownAt)));
    return p;
  }

  function show() {
    win.clearTimeout(hideTimer); win.clearTimeout(leaveTimer);
    root.classList.remove('is-leaving', 'fl--fade', 'fl--slide');
    root.hidden = false; root.removeAttribute('aria-hidden');
    if (C.lockScroll) doc.documentElement.classList.add('fl-lock');
    S.visible = true; S.leaving = false; S.stop = null; S.playing = true; S.T = 0;
    S.shownAt = win.performance.now();
    applyLook(); render(); start();
  }

  /* ---------- Arranque ---------- */
  setup();
  show();
  win.addEventListener('resize', measure);
  if (win.matchMedia) {
    var mq = win.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) mq.addEventListener('change', render);
  }
  if (C.autoHide && C.mode !== 'loop') {
    if (doc.readyState === 'complete') hide(); else win.addEventListener('load', function () { hide(); });
  }

  /* ---------- API pública ---------- */
  win.fondoLoader = {
    hide: hide,
    show: show,
    play: function () { S.playing = true; start(); },
    pause: function () { S.playing = false; },
    seek: function (t) { S.T = Math.max(0, +t || 0); render(); },
    speed: function (v) { if (v > 0) S.speed = v; return S.speed; },
    set: function (o) { C = merge(C, o || {}); applyLook(); render(); return C; },
    config: function () { return C; },
    state: function () {
      var c = cycle();
      return { time: ((S.T % c) + c) % c, duration: c, phase: phaseAt(S.T).name, playing: S.playing, visible: S.visible, points: pointCount };
    },
    // colorea cada pieza y quita el filtro, para ver cómo se reparte el dibujo
    showPieces: function (on) {
      var cols = ['#FF7A59', '#FFD166', '#3DDC97', '#5BC0EB', '#F78FB3', '#FFFFFF', '#FFFFFF'];
      S.debug = !!on;
      pieces.forEach(function (p, i) { p.el.style.fill = on ? cols[i % cols.length] : ''; p.el.style.fillOpacity = on ? 0.85 : ''; });
      render();
    }
  };
})(window, document);

/* ==========================================================================
   FONDO · LOADER — 4 · INTEGRACIÓN CON LA LANDING
   ========================================================================== */
(function (win, doc) {
  'use strict';
  var MAX_WAIT = 7;                                   // segundos: pase lo que pase, el loader sale
  var html = doc.documentElement;
  var root = doc.getElementById('fondo-loader');
  var meta = doc.querySelector('meta[name="theme-color"]');
  var restoreTheme = function () { if (meta) meta.content = meta.getAttribute('data-default') || '#191919'; };

  if (!root || !win.fondoLoader) { html.classList.remove('is-loading'); restoreTheme(); return; }
  root.style.animation = 'none';                      // anula la salida de emergencia del CSS (si el JS no llega)

  // Visita repetida con ONCE activado (ver <head>): fuera sin animación
  if (html.classList.contains('no-loader')) { win.fondoLoader.hide({ immediate: true }); return; }

  win.setTimeout(function () { win.fondoLoader.hide(); }, MAX_WAIT * 1000);

  doc.addEventListener('fondoloader:hide', function () {
    html.classList.remove('is-loading');              // el hero entra mientras sube el telón
    restoreTheme();
    try { win.sessionStorage.setItem('fondo-loader-visto', '1'); } catch (e) { /* modo privado */ }
  });
})(window, document);
