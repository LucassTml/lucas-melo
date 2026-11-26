/* ==========================================================================
   Lucas Melo — portfólio: interações
   Abertura, revelações, campo de pontos do hero, prévias dos projetos,
   GitHub ao vivo, faixa reativa à rolagem e paleta de comandos.
   ========================================================================== */
(() => {
  'use strict';
  window.__lm = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

  /* Contatos vêm do próprio HTML, para ficarem num lugar só. */
  const copyBtn = $('[data-copy]');
  const CONTACT = copyBtn ? copyBtn.dataset.copy : '';
  const GH_USER = 'LucassTml';
  const LINKEDIN = 'https://www.linkedin.com/in/lucas-eduardo-melo-tenorio-05326a311/';

  /* ---------- Laço único de animação ---------- */
  const tasks = new Set();
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(64, now - last);
    last = now;
    tasks.forEach(fn => fn(now, dt));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ---------- Ponteiro compartilhado ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 3, active: false };
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  root.addEventListener('mouseleave', () => { mouse.active = false; });

  /* ---------- Utilidades de texto ---------- */
  function splitChars(el, startIndex = 0) {
    let i = startIndex;
    const targets = el.children.length ? Array.from(el.children) : [el];
    targets.forEach(t => {
      const text = t.textContent;
      t.textContent = '';
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'c';
        s.style.setProperty('--i', i++);
        s.textContent = ch === ' ' ? ' ' : ch;
        t.appendChild(s);
      }
    });
    return i;
  }

  function splitWords(el) {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  function roll(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'roll';
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = b.textContent = text;
    b.setAttribute('aria-hidden', 'true');
    wrap.append(a, b);
    el.appendChild(wrap);
  }

  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
  function scramble(el) {
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    if (reduce) return;
    cancelAnimationFrame(el._raf);
    /* Baseado em tempo, não em quadros: termina igual em qualquer taxa de atualização. */
    const t0 = performance.now();
    const total = 100 + final.length * 50;
    const step = now => {
      const frame = (now - t0) / 16.7;
      let out = '';
      for (let i = 0; i < final.length; i++) {
        out += (frame >= 6 + i * 3 || final[i] === ' ') ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (now - t0 < total) el._raf = requestAnimationFrame(step);
      else el.textContent = final;
    };
    step(t0);
  }

  function countUp(el) {
    const to = +el.dataset.count;
    const from = el._shown != null ? el._shown : +(el.dataset.from || 0);
    el._counted = true;
    if (reduce || from === to) { el.textContent = to; el._shown = to; return; }
    const t0 = performance.now(), dur = 1700;
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 4)));
      el.textContent = v; el._shown = v;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function toast(msg) {
    const t = $('[data-toast]');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('is-on'), 2200);
  }

  async function copyText(text, msg = 'E-mail copiado') {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* sem área de transferência */ }
      ta.remove();
    }
    toast(msg);
  }

  const smoothTo = (el, block = 'start') => el && el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block });

  /* ---------- Preparação do texto ---------- */
  $$('[data-chars]').forEach(el => splitChars(el));
  $$('[data-wordmark]').forEach(el => splitChars(el));
  $$('[data-split]').forEach(splitWords);
  $$('[data-roll]').forEach(roll);
  $$('[data-mod]').forEach(e => { e.textContent = isMac ? '⌘' : 'Ctrl'; });

  /* ---------- Abertura ---------- */
  function ready() {
    root.classList.add('is-ready');
    document.dispatchEvent(new Event('lm:ready'));
  }

  function intro() {
    const el = $('.intro');
    if (!el || root.classList.contains('no-intro')) {
      if (el) el.remove();
      requestAnimationFrame(ready);
      return;
    }
    try { sessionStorage.setItem('lm:intro', '1'); } catch (e) { /* modo privado */ }
    const count = $('.intro-count', el);
    const bar = $('.intro-bar span', el);
    const t0 = performance.now(), dur = 1600;
    root.style.overflow = 'hidden';
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      count.textContent = String(Math.round(e * 100)).padStart(3, '0');
      bar.style.setProperty('--p', e.toFixed(4));
      if (t < 1) { requestAnimationFrame(step); return; }
      setTimeout(() => {
        el.classList.add('is-done');
        root.style.overflow = '';
        setTimeout(ready, 280);
        setTimeout(() => el.remove(), 1400);
      }, 200);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Navegação, progresso e menu ---------- */
  let menuOpen = false;

  function nav() {
    const bar = $('[data-nav]');
    const progress = $('.progress');
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      bar.classList.toggle('is-scrolled', y > 24);
      if (Math.abs(y - lastY) > 4) {
        bar.classList.toggle('is-hidden', y > lastY && y > innerHeight * .7 && !menuOpen);
        lastY = y;
      }
      const h = root.scrollHeight - innerHeight;
      progress.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    bar.addEventListener('focusin', () => bar.classList.remove('is-hidden'));

    const links = $$('.nav-links a');
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(l => l.classList.remove('is-active'));
        const a = byId.get(e.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => so.observe(s));
  }

  function menu() {
    const btn = $('[data-menu-btn]');
    const panel = $('[data-menu]');
    if (!btn || !panel) return;
    const set = open => {
      menuOpen = open;
      btn.setAttribute('aria-expanded', open);
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
        root.style.overflow = 'hidden';
        $('[data-nav]').classList.remove('is-hidden');
      } else {
        panel.classList.remove('is-open');
        root.style.overflow = '';
        setTimeout(() => { if (!menuOpen) panel.hidden = true; }, 800);
      }
    };
    btn.addEventListener('click', () => set(!menuOpen));
    panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { set(false); btn.focus(); } });
    matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches && menuOpen) set(false); });
  }

  /* ---------- Revelações ao rolar ---------- */
  function reveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('is-in');
        io.unobserve(el);
        if (el.classList.contains('label')) {
          const s = $('[data-scramble]', el);
          if (s) scramble(s);
        }
        $$('[data-count]', el).forEach(countUp);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal], [data-split], [data-wordmark]').forEach(el => io.observe(el));
    $$('.label').forEach(l => l.addEventListener('pointerenter', () => {
      const s = $('[data-scramble]', l);
      if (s) scramble(s);
    }));
  }

  /* ---------- Campo de pontos do hero ---------- */
  function heroField() {
    const hero = $('.hero');
    const canvas = $('.hero-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, pts = [], visible = true;
    const ripples = [];

    function build() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = W < 720 ? 22 : 28;
      const cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
      const ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
      pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const bx = ox + i * gap, by = oy + j * gap;
          pts.push({ bx, by, x: bx, y: by, vx: 0, vy: 0 });
        }
      }
      if (reduce) draw(0, 16);
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      const r = canvas.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      const R = 160, R2 = R * R;
      const live = mouse.active && finePointer && !reduce;
      const s = dt / 1000;
      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k];
        rp.r += rp.speed * s;
        rp.life -= s * .55;
        if (rp.life <= 0) ripples.splice(k, 1);
      }
      ctx.fillStyle = '#ecebe6';
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        let tx = p.bx, ty = p.by;
        if (!reduce) {
          tx += Math.sin(t * .0005 + p.by * .012) * 1.5;
          ty += Math.cos(t * .0004 + p.bx * .010) * 1.5;
        }
        if (live) {
          const dx = p.bx - mx, dy = p.by - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1, f = 1 - d / R, push = f * f * 36;
            tx += dx / d * push; ty += dy / d * push;
          }
        }
        for (let q = 0; q < ripples.length; q++) {
          const rp = ripples[q];
          const dx = p.bx - rp.x, dy = p.by - rp.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = d - rp.r;
          if (band > -70 && band < 70) {
            const amp = Math.cos(band / 70 * Math.PI / 2) * rp.amp * rp.life;
            tx += dx / d * amp; ty += dy / d * amp;
          }
        }
        p.vx = (p.vx + (tx - p.x) * .08) * .8;
        p.vy = (p.vy + (ty - p.y) * .08) * .8;
        p.x += p.vx; p.y += p.vy;
        const disp = Math.abs(p.x - p.bx) + Math.abs(p.y - p.by);
        const size = 1.1 + Math.min(disp * .05, 1.3);
        ctx.globalAlpha = Math.min(.09 + disp * .028, .8);
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    const ripple = (x, y, amp = 20) => ripples.push({ x, y, r: 0, speed: 560, amp, life: 1 });

    new ResizeObserver(build).observe(canvas);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    build();
    if (reduce) return;

    hero.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button')) return;
      const r = canvas.getBoundingClientRect();
      ripple(e.clientX - r.left, e.clientY - r.top);
      const hint = $('.hero-hint');
      if (hint) hint.style.opacity = '0';
    });
    document.addEventListener('lm:ready', () => setTimeout(() => ripple(W * .3, H * .78, 16), 500), { once: true });
    if (!finePointer) setInterval(() => { if (visible) ripple(Math.random() * W, Math.random() * H * .8, 12); }, 4200);
    tasks.add((t, dt) => { if (visible && !document.hidden) draw(t, dt); });
  }

  /* ---------- Prévias geradas para cada projeto ---------- */
  const FG = a => `rgba(236,235,230,${a})`;
  const ACC = '#d6c49b';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';

  const seeded = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const GRAPH = (() => {
    const rnd = seeded(11);
    const nodes = Array.from({ length: 14 }, () => ({ x: .08 + rnd() * .84, y: .1 + rnd() * .72, ph: rnd() * 6.28 }));
    const edges = [];
    nodes.forEach((a, i) => {
      nodes.map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2])
        .filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2)
        .forEach(([j]) => { if (!edges.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) edges.push([i, j]); });
    });
    return { nodes, edges };
  })();

  const COLORING = (() => {
    const nodes = [[.16, .28], [.4, .16], [.66, .22], [.86, .44], [.62, .5], [.36, .52], [.14, .7], [.46, .8], [.76, .78]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 0], [5, 6], [6, 7], [7, 4], [7, 8], [8, 3], [5, 1], [2, 4]];
    const color = [];
    nodes.forEach((_, i) => {
      const used = new Set(edges.filter(e => e.includes(i)).map(e => (e[0] === i ? e[1] : e[0])).filter(j => j < i).map(j => color[j]));
      let c = 0;
      while (used.has(c)) c++;
      color[i] = c;
    });
    return { nodes, edges, color, k: Math.max(...color) + 1 };
  })();

  const TD = {
    cells: [[0, 1], [3, 1], [3, 4], [6, 4], [6, 1], [9, 1], [9, 5]],
    towers: [[1, 3], [5, 2], [8, 3], [4, 5.4], [7.6, 0.2]]
  };

  function pointOn(poly, u) {
    let total = 0;
    const seg = [];
    for (let i = 1; i < poly.length; i++) {
      const l = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
      seg.push(l); total += l;
    }
    let d = u * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i]) {
        const t = d / seg[i];
        return [lerp(poly[i][0], poly[i + 1][0], t), lerp(poly[i][1], poly[i + 1][1], t)];
      }
      d -= seg[i];
    }
    return poly[poly.length - 1];
  }

  const SCENES = {
    audian(c, w, h, t) {
      const n = 52, gap = (w - 28) / n, mid = h / 2;
      const speak = .3 + .7 * Math.abs(Math.sin(t * .0011) * Math.sin(t * .00037 + 1));
      const head = (t * .00022) % 1;
      for (let i = 0; i < n; i++) {
        const x = 14 + i * gap + gap / 2;
        const env = Math.sin(Math.PI * i / (n - 1));
        const v = (Math.sin(i * .42 + t * .006) * .5 + .5) * (Math.sin(i * .13 - t * .0027) * .5 + .5);
        const amp = Math.max(1.5, v * env * speak * h * .34);
        c.fillStyle = i / n < head ? FG(.9) : FG(.22);
        c.fillRect(x - 1.1, mid - amp, 2.2, amp * 2);
      }
      c.font = `10px ${MONO}`;
      c.fillStyle = ACC;
      c.fillText('● REC', 14, 22);
      c.fillStyle = FG(.45);
      c.fillText('offline · whisper + qwen', 14, h - 14);
    },

    antigravity(c, w, h, t) {
      const lines = ['$ opencode', '> provider: agy (terminal)', '> chave de API: nenhuma', '> oauth: nenhum', '> agente pronto ✓', '$ '];
      const total = lines.reduce((s, l) => s + l.length, 0);
      let k = Math.floor(t * .03) % (total + 70);
      c.font = `11px ${MONO}`;
      let y = 30, cx = 18, cy = 30;
      for (const L of lines) {
        if (k <= 0) break;
        const s = L.slice(0, k);
        k -= L.length;
        c.fillStyle = L.startsWith('$') ? FG(.95) : (L.includes('✓') && s === L ? ACC : FG(.5));
        c.fillText(s, 18, y);
        cx = 18 + c.measureText(s).width + 2; cy = y;
        y += 24;
      }
      if (Math.floor(t / 420) % 2 === 0) { c.fillStyle = FG(.9); c.fillRect(cx, cy - 9, 6, 11); }
    },

    texttosql(c, w, h, t) {
      const q = 'Quais filmes têm nota acima de 4?';
      const sql = ['SELECT titulo, nota_media', 'FROM gold.filmes', 'WHERE nota_media > 4', 'ORDER BY nota_media DESC;'];
      const tt = t % 10000;
      const qn = Math.min(q.length, Math.floor(tt / 38));
      c.font = '15px "Instrument Serif", Georgia, serif';
      c.fillStyle = FG(.95);
      c.fillText(q.slice(0, qn), 18, 34);
      const qDone = q.length * 38 + 350;
      if (tt > qDone) {
        c.fillStyle = FG(.35);
        c.font = `10px ${MONO}`;
        c.fillText('↓ agente · guardrails ok', 18, 58);
        let k = Math.floor((tt - qDone - 300) / 26);
        let y = 86;
        for (const L of sql) {
          if (k <= 0) break;
          const s = L.slice(0, k);
          k -= L.length;
          const m = s.match(/^(SELECT|FROM|WHERE|ORDER BY)?(.*)$/);
          c.font = `11px ${MONO}`;
          let x = 18;
          if (m[1]) { c.fillStyle = ACC; c.fillText(m[1], x, y); x += c.measureText(m[1]).width; }
          c.fillStyle = FG(.8);
          c.fillText(m[2], x, y);
          y += 20;
        }
      }
    },

    ressonancia(c, w, h, t) {
      const mid = h / 2;
      c.fillStyle = FG(.07);
      c.fillRect(0, mid, w, 1);
      const waves = [{ f: 1.5, a: .2, p: .0024 }, { f: 3, a: .11, p: -.0038 }, { f: 4.5, a: .06, p: .0054 }];
      waves.forEach(wv => {
        c.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = mid + Math.sin(x / w * Math.PI * 2 * wv.f + t * wv.p) * wv.a * h;
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.strokeStyle = FG(.18); c.lineWidth = 1; c.stroke();
      });
      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        let y = mid;
        waves.forEach(wv => { y += Math.sin(x / w * Math.PI * 2 * wv.f + t * wv.p) * wv.a * h; });
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.strokeStyle = ACC; c.lineWidth = 1.5; c.stroke();
      c.font = `10px ${MONO}`;
      c.fillStyle = FG(.45);
      c.fillText('web audio · síntese aditiva', 14, h - 14);
    },

    overwatch(c, w, h, t) {
      const P = GRAPH.nodes.map(n => [n.x * w + Math.sin(t * .0012 + n.ph) * 5, n.y * h + Math.cos(t * .001 + n.ph) * 5]);
      const hi = Math.floor(t / 1100) % P.length;
      GRAPH.edges.forEach(([a, b]) => {
        const on = a === hi || b === hi;
        c.beginPath(); c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]);
        c.strokeStyle = on ? 'rgba(214,196,155,.9)' : FG(.16); c.lineWidth = on ? 1.3 : 1; c.stroke();
      });
      P.forEach(([x, y], i) => {
        c.beginPath(); c.arc(x, y, i === hi ? 4.5 : 2.6, 0, Math.PI * 2);
        c.fillStyle = i === hi ? ACC : FG(.85); c.fill();
        if (i === hi) { c.beginPath(); c.arc(x, y, 9 + Math.sin(t * .006) * 2, 0, Math.PI * 2); c.strokeStyle = 'rgba(214,196,155,.35)'; c.stroke(); }
      });
      c.font = `10px ${MONO}`;
      c.fillStyle = FG(.45);
      c.fillText('counters · sinergias', 14, h - 14);
    },

    cinelab(c, w, h, t) {
      const cols = 6, rows = 2, pad = 18, g = 8;
      const pw = (w - pad * 2 - g * (cols - 1)) / cols, ph = pw * 1.42;
      const top = (h - (rows * ph + g)) / 2 - 10;
      const active = Math.floor(t / 650) % (cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const i = r * cols + k, x = pad + k * (pw + g), y = top + r * (ph + g);
          c.fillStyle = i === active ? FG(.92) : FG(.05 + ((i * 37) % 5) * .02);
          c.fillRect(x, y, pw, ph);
        }
      }
      const rating = 3 + ((active * 7) % 20) / 10;
      const full = Math.round(rating);
      c.font = `10px ${MONO}`;
      c.fillStyle = ACC;
      c.fillText('★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full), 14, h - 14);
      c.fillStyle = FG(.45);
      c.fillText(`média ${rating.toFixed(1).replace('.', ',')} · catálogo`, 84, h - 14);
    },

    portfolioxp(c, w, h, t) {
      c.fillStyle = FG(.07); c.fillRect(0, h - 20, w, 20);
      c.fillStyle = 'rgba(214,196,155,.85)'; c.fillRect(6, h - 15, 38, 10);
      for (let k = 0; k < 3; k++) {
        const ph = t * .0007 + k * 2.1;
        const ww = w * .5, wh = h * .46;
        const x = 22 + k * 52 + Math.sin(ph) * 6, y = 14 + k * 26 + Math.cos(ph * 1.3) * 4;
        c.fillStyle = '#0f0f0e'; c.fillRect(x, y, ww, wh);
        c.strokeStyle = FG(k === 2 ? .55 : .22); c.lineWidth = 1; c.strokeRect(x + .5, y + .5, ww, wh);
        c.fillStyle = k === 2 ? FG(.85) : FG(.16); c.fillRect(x, y, ww + 1, 12);
        c.fillStyle = k === 2 ? '#0f0f0e' : FG(.3);
        for (let d = 0; d < 3; d++) c.fillRect(x + ww - 10 - d * 8, y + 4, 4, 4);
        c.fillStyle = FG(.12);
        for (let l = 0; l < 4; l++) c.fillRect(x + 10, y + 22 + l * 10, ww * (.4 + ((l * 13 + k * 7) % 5) * .1), 3);
        c.fillStyle = FG(k === 2 ? .6 : .2); c.fillRect(x + 64 + k * 6, h - 15, 44, 10);
      }
    },

    cinedata(c, w, h, t) {
      const names = ['OURO', 'PRATA', 'BRONZE'];
      const bh = (h - 24) / 3;
      names.forEach((name, i) => {
        const y = 10 + i * bh;
        c.strokeStyle = FG(.1 + (2 - i) * .06); c.lineWidth = 1;
        c.strokeRect(14.5, y + .5, w - 29, bh - 8);
        c.font = `9.5px ${MONO}`;
        c.fillStyle = i === 0 ? ACC : FG(.5);
        c.fillText(name, 22, y + 16);
      });
      for (let i = 0; i < 70; i++) {
        const u = (t * (.00007 + (i % 7) * .000012) + i * .137) % 1;
        const y = h - 22 - u * (h - 36);
        const x = 70 + ((i * 73) % 100) / 100 * (w - 100) + Math.sin(t * .002 + i) * 3;
        const level = y < 10 + bh ? 0 : y < 10 + bh * 2 ? 1 : 2;
        if ((level === 0 && i % 3) || (level === 1 && i % 2)) continue;
        c.fillStyle = level === 0 ? ACC : FG(level === 1 ? .75 : .35);
        const s = level === 2 ? 1.6 : 2.2;
        c.fillRect(x, y, s, s);
      }
    },

    tower(c, w, h, t) {
      const cols = 10, rows = 6;
      const cs = Math.min((w - 28) / cols, (h - 28) / rows);
      const ox = (w - cs * cols) / 2, oy = (h - cs * rows) / 2;
      c.fillStyle = FG(.1);
      for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) c.fillRect(ox + x * cs - .5, oy + y * cs - .5, 1, 1);
      const P = TD.cells.map(([x, y]) => [ox + x * cs + cs / 2, oy + y * cs + cs / 2]);
      c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.strokeStyle = FG(.07); c.lineWidth = cs * .7; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = FG(.2); c.lineWidth = 1; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
      const enemies = [0, 1, 2, 3, 4].map(k => pointOn(P, ((t * .00008) + k * .16) % 1));
      enemies.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fillStyle = FG(.9); c.fill(); });
      const range = cs * 2.1;
      TD.towers.forEach(([tx, ty], i) => {
        const x = ox + tx * cs + cs / 2, y = oy + ty * cs + cs / 2;
        c.strokeStyle = 'rgba(214,196,155,.16)';
        c.beginPath(); c.arc(x, y, range * (.92 + Math.sin(t * .003 + i) * .08), 0, Math.PI * 2); c.stroke();
        c.fillStyle = ACC; c.fillRect(x - 4, y - 4, 8, 8);
        const target = enemies.find(([ex, ey]) => Math.hypot(ex - x, ey - y) < range);
        if (target && Math.floor(t / 110 + i) % 3 === 0) {
          c.beginPath(); c.moveTo(x, y); c.lineTo(target[0], target[1]);
          c.strokeStyle = 'rgba(214,196,155,.8)'; c.stroke();
        }
      });
    },

    grade(c, w, h, t) {
      const shades = [ACC, FG(.92), '#7e7d77', '#4b4a46', '#2a2a28'];
      const P = COLORING.nodes.map(([x, y]) => [x * w, y * (h - 26) + 6]);
      const step = Math.floor((t % 7000) / 480);
      COLORING.edges.forEach(([a, b]) => {
        c.beginPath(); c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]);
        c.strokeStyle = FG(.18); c.lineWidth = 1; c.stroke();
      });
      P.forEach(([x, y], i) => {
        c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2);
        c.fillStyle = '#0f0f0e'; c.fill();
        if (i < step) { c.fillStyle = shades[COLORING.color[i]]; c.fill(); }
        else { c.strokeStyle = FG(.4); c.stroke(); }
        if (i === step) { c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.strokeStyle = 'rgba(214,196,155,.5)'; c.stroke(); }
      });
      c.font = `10px ${MONO}`;
      c.fillStyle = FG(.45);
      c.fillText(step >= P.length ? `k = ${COLORING.k} cores · sem conflitos` : 'coloração gulosa…', 14, h - 12);
    }
  };

  /* ---------- Projetos: lista, filtros e prévia ---------- */
  function toggleProject(li, force) {
    const open = force != null ? force : !li.classList.contains('is-open');
    li.classList.toggle('is-open', open);
    $('.project-row', li).setAttribute('aria-expanded', open);
    $('.project-detail', li).inert = !open;
  }

  function openProject(li) {
    if (li.classList.contains('is-hidden')) {
      const all = $('[data-filter="all"]');
      if (all) all.click();
    }
    toggleProject(li, true);
    setTimeout(() => smoothTo(li, 'center'), 80);
    $('.project-row', li).focus({ preventScroll: true });
  }

  function projects() {
    const list = $('[data-projects]');
    if (!list) return;
    const items = $$('.project', list);
    items.forEach(li => {
      $('.project-detail', li).inert = true;
      $('.project-row', li).addEventListener('click', () => toggleProject(li));
    });

    const filters = $$('[data-filter]');
    filters.forEach(f => f.addEventListener('click', () => {
      const cat = f.dataset.filter;
      filters.forEach(x => x.setAttribute('aria-pressed', x === f));
      let n = 0;
      items.forEach(li => {
        const show = cat === 'all' || li.dataset.cat === cat;
        li.classList.toggle('is-hidden', !show);
        li.inert = !show;
        if (show) $('.p-num', li).textContent = String(++n).padStart(2, '0');
        else if (li.classList.contains('is-open')) toggleProject(li, false);
      });
    }));

    const hash = decodeURIComponent(location.hash.slice(1));
    const target = hash && items.find(li => li.id === hash);
    if (target) document.addEventListener('lm:ready', () => openProject(target), { once: true });

    preview(list, items);
  }

  function preview(list, items) {
    const box = $('[data-preview-box]');
    if (!box || !finePointer) return;
    const canvas = $('canvas', box);
    const ctx = canvas.getContext('2d');
    const nameEl = $('[data-preview-name]', box);
    const numEl = $('[data-preview-n]', box);
    let key = null, lastKey = null, on = false, offAt = 0, t0 = 0, rect = { w: 0, h: 0 };
    let px = mouse.x, py = mouse.y, rot = 0;

    const size = () => {
      const r = canvas.getBoundingClientRect();
      const d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * d);
      canvas.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      rect = { w: r.width, h: r.height };
    };
    size();
    addEventListener('resize', size);

    const setOn = v => {
      if (v === on) return;
      on = v;
      if (!v) offAt = performance.now();
      box.classList.toggle('is-on', v);
    };

    list.addEventListener('pointerover', e => {
      if (e.pointerType === 'touch') return;
      const row = e.target.closest('.project-row');
      const li = row && row.closest('.project');
      const want = li && !li.classList.contains('is-open') ? li.dataset.preview : null;
      if (want && want !== key) {
        nameEl.textContent = $('.p-name', li).textContent;
        const visible = items.filter(x => !x.classList.contains('is-hidden')).length;
        numEl.textContent = `${$('.p-num', li).textContent} / ${String(visible).padStart(2, '0')}`;
        t0 = performance.now();
        lastKey = want;
        if (!on) { px = mouse.x + 28; py = mouse.y - rect.h / 2; }
      }
      key = want;
      setOn(!!want);
    });
    list.addEventListener('pointerleave', () => { key = null; setOn(false); });
    list.addEventListener('click', () => { key = null; setOn(false); });
    addEventListener('scroll', () => {
      if (!on) return;
      const el = document.elementFromPoint(mouse.x, mouse.y);
      if (!el || !el.closest('.project-row')) { key = null; setOn(false); }
    }, { passive: true });

    tasks.add(now => {
      const W = rect.w + 2, H = rect.h + 36;
      let tx = mouse.x + 28;
      if (tx + W > innerWidth - 16) tx = mouse.x - W - 28;
      const ty = clamp(mouse.y - H / 2, 16, innerHeight - H - 16);
      const vx = tx - px;
      px = lerp(px, tx, .14);
      py = lerp(py, ty, .14);
      rot = lerp(rot, clamp(vx * .035, -5, 5), .1);
      box.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      const drawing = on || now - offAt < 750;
      if (drawing && lastKey && SCENES[lastKey]) {
        ctx.clearRect(0, 0, rect.w, rect.h);
        SCENES[lastKey](ctx, rect.w, rect.h, now - t0);
      }
    });
  }

  /* ---------- GitHub ao vivo ---------- */
  const LANG = { Rust: '#dea584', Python: '#3572a5', JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219', HTML: '#e34c26', MDX: '#fcb32c', 'Jupyter Notebook': '#da5b0b', CSS: '#663399' };

  function timeAgo(iso) {
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, s] of units) if (Math.abs(diff) >= s || u === 'minute') return rtf.format(Math.round(diff / s), u);
    return '';
  }

  async function github() {
    const feed = $('[data-gh-feed]');
    if (!feed) return;
    const KEY = 'lm:gh:v1';
    let data = null;
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.at < 10 * 60 * 1000) data = c;
    } catch (e) { /* sem cache */ }

    if (!data) {
      try {
        const get = url => fetch(url).then(r => (r.ok ? r.json() : Promise.reject(r.status)));
        const [user, repos] = await Promise.all([
          get(`https://api.github.com/users/${GH_USER}`),
          get(`https://api.github.com/users/${GH_USER}/repos?sort=pushed&per_page=12`)
        ]);
        data = {
          at: Date.now(),
          count: user.public_repos,
          repos: repos.filter(r => !r.fork && r.name !== GH_USER).slice(0, 6)
            .map(r => ({ name: r.name, desc: r.description || '', lang: r.language || '', url: r.html_url, pushed: r.pushed_at }))
        };
        try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* cheio */ }
      } catch (e) {
        feed.textContent = '';
        const li = document.createElement('li');
        li.className = 'gh-error';
        li.append('Não deu para carregar os repositórios agora. ');
        const a = document.createElement('a');
        a.href = `https://github.com/${GH_USER}?tab=repositories`;
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'Ver no GitHub ↗';
        li.appendChild(a);
        feed.appendChild(li);
        return;
      }
    }

    feed.textContent = '';
    data.repos.forEach((r, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
      const name = document.createElement('span'); name.className = 'gh-name'; name.textContent = r.name;
      const desc = document.createElement('span'); desc.className = 'gh-desc'; desc.textContent = r.desc;
      const lang = document.createElement('span'); lang.className = 'gh-lang'; lang.textContent = r.lang || '—';
      if (LANG[r.lang]) lang.style.setProperty('--lc', LANG[r.lang]);
      const time = document.createElement('span'); time.className = 'gh-time'; time.textContent = timeAgo(r.pushed);
      a.append(name, desc, lang, time);
      li.appendChild(a);
      if (!reduce) li.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      feed.appendChild(li);
    });

    const counter = $('[data-gh-count]');
    if (counter && data.count) {
      counter.dataset.count = data.count;
      if (counter._counted) countUp(counter);
      else counter.textContent = data.count;
    }
  }

  /* ---------- Relógio de Recife ---------- */
  function clock() {
    const els = $$('[data-clock]');
    if (!els.length) return;
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' });
    const tick = () => {
      const s = fmt.format(new Date());
      els.forEach(e => { e.textContent = s; e.setAttribute('datetime', s); });
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- Botões magnéticos ---------- */
  function magnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(x * .28).toFixed(1)}px, ${(y * .4).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Faixa que reage à rolagem ---------- */
  function marquee() {
    const m = $('[data-marquee]');
    if (!m) return;
    const track = $('.marquee-track', m);
    track.innerHTML += track.innerHTML;
    if (reduce) return;
    let x = 0, vel = 0, skew = 0, dir = 1, lastY = scrollY, visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(m);
    tasks.add((now, dt) => {
      const y = scrollY;
      vel = lerp(vel, y - lastY, .12);
      lastY = y;
      if (!visible) return;
      if (vel > .8) dir = 1; else if (vel < -.8) dir = -1;
      const half = track.scrollWidth / 2;
      x -= dir * .045 * dt * (1 + Math.min(Math.abs(vel) * .18, 7));
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      skew = lerp(skew, clamp(-vel * .22, -9, 9), .12);
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    });
  }

  /* ---------- Linha da trajetória ---------- */
  function timeline() {
    const tl = $('[data-timeline]');
    if (!tl) return;
    const upd = () => {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--p', clamp((innerHeight * .62 - r.top) / r.height, 0, 1).toFixed(4));
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------- Paleta de comandos ---------- */
  function palette() {
    const pal = $('[data-palette]');
    const input = $('[data-palette-input]');
    const list = $('[data-palette-list]');
    if (!pal) return;

    const go = id => () => smoothTo(document.getElementById(id));
    const open = url => () => window.open(url, '_blank', 'noopener');
    const mailLink = $('.mail-link');

    const cmds = [
      { t: 'Ir para Sobre', g: 'Seção', i: '01', run: go('sobre') },
      { t: 'Ir para Projetos', g: 'Seção', i: '02', run: go('projetos') },
      { t: 'Ir para Habilidades', g: 'Seção', i: '03', run: go('habilidades') },
      { t: 'Ir para Trajetória', g: 'Seção', i: '04', run: go('trajetoria') },
      { t: 'Ir para Contato', g: 'Seção', i: '05', run: go('contato') },
      ...$$('.project').map(li => ({
        t: $('.p-name', li).textContent,
        k: `${$('.p-stack', li).textContent} ${$('.p-cat', li).textContent} projeto`,
        g: 'Projeto', i: '◇', run: () => openProject(li)
      })),
      { t: 'Copiar e-mail', k: 'email contato', g: 'Ação', i: '@', run: () => copyText(CONTACT) },
      { t: 'Escrever um e-mail', k: 'email contato mensagem', g: 'Ação', i: '✉', run: () => { if (mailLink) mailLink.click(); } },
      { t: 'Abrir GitHub', k: 'codigo repositorios', g: 'Link', i: '↗', run: open(`https://github.com/${GH_USER}`) },
      { t: 'Abrir LinkedIn', k: 'perfil', g: 'Link', i: '↗', run: open(LINKEDIN) },
      { t: 'Currículo, edição 1996', k: 'cv curriculo retro anos 90 html', g: 'Versão', i: '→', run: () => { location.href = 'curriculo/'; } },
      { t: 'PortfolioXP, estilo Windows XP', k: 'xp windows retro', g: 'Versão', i: '↗', run: open('https://lucasstml.github.io/PortfolioXP/') },
      { t: 'Voltar ao topo', k: 'inicio', g: 'Seção', i: '↑', run: go('topo') }
    ];

    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const score = (c, q) => {
      if (!q) return 1;
      const name = norm(c.t);
      if (name.startsWith(q)) return 300;
      const ni = name.indexOf(q);
      if (ni >= 0) return 200 - ni;
      const hay = norm(`${c.t} ${c.k || ''} ${c.g}`);
      const hi = hay.indexOf(q);
      if (hi >= 0) return 100 - Math.min(hi, 90);
      let j = 0;
      for (const ch of name) if (ch === q[j]) j++;
      return j === q.length ? 5 : 0;
    };

    let items = [], sel = 0, isOpen = false, lastFocus = null;

    const mark = () => {
      Array.from(list.children).forEach((li, i) => li.setAttribute('aria-selected', i === sel));
      const cur = list.children[sel];
      if (cur && cur.id) { cur.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', cur.id); }
    };

    const render = () => {
      const q = norm(input.value.trim());
      items = cmds.map(c => [c, score(c, q)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      sel = clamp(sel, 0, Math.max(0, items.length - 1));
      list.textContent = '';
      if (!items.length) {
        const li = document.createElement('li');
        li.className = 'pl-empty';
        li.textContent = 'Nada encontrado. Tente “projetos” ou “e-mail”.';
        list.appendChild(li);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      items.forEach((c, i) => {
        const li = document.createElement('li');
        li.id = `pi-${i}`;
        li.setAttribute('role', 'option');
        const ico = document.createElement('span'); ico.className = 'pi-ico'; ico.textContent = c.i;
        const tx = document.createElement('span'); tx.className = 'pi-t'; tx.textContent = c.t;
        const gr = document.createElement('span'); gr.className = 'pi-group'; gr.textContent = c.g;
        li.append(ico, tx, gr);
        li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; mark(); } });
        li.addEventListener('click', () => exec(i));
        list.appendChild(li);
      });
      mark();
    };

    const show = () => {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      pal.hidden = false;
      input.value = '';
      sel = 0;
      render();
      requestAnimationFrame(() => pal.classList.add('is-open'));
      input.focus();
    };
    const hide = (restore = true) => {
      if (!isOpen) return;
      isOpen = false;
      pal.classList.remove('is-open');
      setTimeout(() => { if (!isOpen) pal.hidden = true; }, 380);
      if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    function exec(i) {
      const c = items[i];
      if (!c) return;
      hide(false);
      setTimeout(() => c.run(), 60);
    }

    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; mark(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); hide(); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    $$('[data-palette-open]').forEach(b => b.addEventListener('click', show));
    $('[data-palette-close]').addEventListener('click', () => hide());
    addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) hide(); else show();
      } else if (e.key === '/' && !isOpen && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        show();
      }
    });
  }

  /* ---------- Copiar ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy)));

  /* ---------- Início ---------- */
  nav();
  menu();
  reveals();
  heroField();
  projects();
  magnetic();
  marquee();
  timeline();
  palette();
  clock();
  github();
  intro();
})();
