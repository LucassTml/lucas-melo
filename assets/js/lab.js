/* ==========================================================================
   Laboratório: busca de caminhos (BFS, DFS, Dijkstra, A*) e ordenação.
   Canvas 2D puro, sem bibliotecas.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const lab = $('[data-lab]');
  if (!lab) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FG = a => `rgba(236,235,230,${a})`;
  const ACC = a => `rgba(214,196,155,${a})`;

  /* ---------- Grupo de botões que funciona como rádio ---------- */
  function radio(el, onChange) {
    const btns = $$('button', el);
    const set = v => btns.forEach(b => {
      const on = b.dataset.v === v;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    const get = () => (btns.find(b => b.getAttribute('aria-checked') === 'true') || btns[0]).dataset.v;
    btns.forEach(b => b.addEventListener('click', () => {
      if (get() === b.dataset.v) return;
      set(b.dataset.v);
      if (onChange) onChange(b.dataset.v);
    }));
    el.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const i = btns.findIndex(b => b.dataset.v === get());
      const n = btns[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length];
      n.click();
      n.focus();
    });
    set(get());
    return { get, set };
  }

  /* Fila de prioridade (heap binário) para Dijkstra e A* */
  class Heap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(item, pri) {
      const a = this.a;
      a.push([pri, item]);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= a[i][0]) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    }
    pop() {
      const a = this.a;
      const top = a[0];
      const end = a.pop();
      if (a.length) {
        a[0] = end;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break;
          [a[m], a[i]] = [a[i], a[m]];
          i = m;
        }
      }
      return top[1];
    }
  }

  function fitCanvas(canvas, ctx) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  /* ==========================================================================
     Busca de caminhos
     ========================================================================== */
  const path = (() => {
    const canvas = $('[data-path-canvas]');
    const ctx = canvas.getContext('2d');
    const out = {
      visited: $('[data-path-visited]'),
      steps: $('[data-path-steps]'),
      cost: $('[data-path-cost]')
    };
    const runBtn = $('[data-path-run]');
    const newBtn = $('[data-path-new]');

    let W = 0, H = 0, cols = 0, rows = 0, N = 0, cs = 0, ox = 0, oy = 0;
    let walls, mud, order, frontier, start, end;
    let count = 0, result = null, searched = false;
    let gen = null, raf = 0, running = false, carving = null, carveHead = -1, pathT = 0;

    const algo = radio($('[data-path-algo]'), () => { if (searched) run(); });
    const map = radio($('[data-path-map]'), () => generate(false));

    const idx = (x, y) => y * cols + x;
    const weight = i => (mud[i] ? 5 : 1);
    const neighbors = i => {
      const x = i % cols, y = (i / cols) | 0, r = [];
      if (x < cols - 1) r.push(i + 1);
      if (y < rows - 1) r.push(i + cols);
      if (x > 0) r.push(i - 1);
      if (y > 0) r.push(i - cols);
      return r;
    };
    const manhattan = i => Math.abs((i % cols) - (end % cols)) + Math.abs(((i / cols) | 0) - ((end / cols) | 0));

    function resize() {
      const s = fitCanvas(canvas, ctx);
      if (!s) return;
      W = s.w; H = s.h;
      const target = W < 600 ? 17 : 21;
      let c = Math.floor(W / target), r = Math.floor(H / target);
      if (c % 2 === 0) c--;
      if (r % 2 === 0) r--;
      cs = Math.min(W / c, H / r);
      ox = (W - cs * c) / 2;
      oy = (H - cs * r) / 2;
      if (c !== cols || r !== rows) {
        cols = c; rows = r; N = cols * rows;
        generate(true);
      } else {
        draw();
      }
    }

    function resetSearch() {
      order = new Int32Array(N).fill(-1);
      frontier = new Uint8Array(N);
      count = 0; result = null; pathT = 0;
      updateStats();
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      runBtn.textContent = 'Buscar';
    }

    function* carve() {
      walls.fill(1);
      walls[idx(1, 1)] = 0;
      const stack = [[1, 1]];
      const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
      while (stack.length) {
        const [x, y] = stack[stack.length - 1];
        const opts = dirs.map(([dx, dy]) => [x + dx, y + dy, dx, dy])
          .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && walls[idx(nx, ny)]);
        if (!opts.length) { stack.pop(); continue; }
        const [nx, ny, dx, dy] = opts[(Math.random() * opts.length) | 0];
        walls[idx(x + dx / 2, y + dy / 2)] = 0;
        walls[idx(nx, ny)] = 0;
        stack.push([nx, ny]);
        yield idx(nx, ny);
      }
      /* Abre algumas passagens extras: com mais de um caminho, os algoritmos se diferenciam. */
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = idx(x, y);
          if (walls[i] && (x % 2) !== (y % 2) && Math.random() < .08) walls[i] = 0;
        }
      }
    }

    function field() {
      walls.fill(0);
      const blobs = Math.max(4, Math.round(N / 140));
      for (let b = 0; b < blobs; b++) {
        const cx = Math.random() * cols, cy = Math.random() * rows, rad = 2 + Math.random() * 3.5;
        for (let y = Math.max(0, Math.floor(cy - rad)); y < Math.min(rows, Math.ceil(cy + rad)); y++) {
          for (let x = Math.max(0, Math.floor(cx - rad)); x < Math.min(cols, Math.ceil(cx + rad)); x++) {
            if (Math.hypot(x - cx, y - cy) < rad * (.75 + Math.random() * .35)) mud[idx(x, y)] = 1;
          }
        }
      }
      for (let i = 0; i < N; i++) if (!mud[i] && Math.random() < .2) walls[i] = 1;
    }

    function finalize() {
      walls[start] = walls[end] = 0;
      mud[start] = mud[end] = 0;
      carving = null; carveHead = -1;
      draw();
    }

    function generate(instant) {
      stop();
      walls = new Uint8Array(N);
      mud = new Uint8Array(N);
      start = idx(1, 1);
      end = idx(cols - 2, rows - 2);
      searched = false;
      resetSearch();
      if (map.get() === 'field') { field(); finalize(); return; }
      const g = carve();
      if (instant || reduce) {
        while (!g.next().done);
        finalize();
        return;
      }
      carving = g;
      const per = Math.max(3, Math.round(N / 260));
      const step = () => {
        if (carving !== g) return;
        for (let k = 0; k < per; k++) {
          const r = g.next();
          if (r.done) { finalize(); return; }
          carveHead = r.value;
        }
        draw();
        raf = requestAnimationFrame(step);
      };
      step();
    }

    function buildPath(prev) {
      const p = [];
      for (let v = end; v !== -1; v = prev[v]) p.push(v);
      p.reverse();
      let total = 0;
      for (let k = 1; k < p.length; k++) total += weight(p[k]);
      return { path: p, steps: p.length - 1, cost: total };
    }

    const ALGOS = {
      *bfs() {
        const prev = new Int32Array(N).fill(-1);
        const seen = new Uint8Array(N);
        const q = [start];
        seen[start] = 1;
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          yield u;
          if (u === end) return buildPath(prev);
          for (const v of neighbors(u)) {
            if (walls[v] || seen[v]) continue;
            seen[v] = 1; prev[v] = u; frontier[v] = 1; q.push(v);
          }
        }
        return null;
      },
      *dfs() {
        const prev = new Int32Array(N).fill(-1);
        const seen = new Uint8Array(N);
        const st = [start];
        while (st.length) {
          const u = st.pop();
          if (seen[u]) continue;
          seen[u] = 1;
          yield u;
          if (u === end) return buildPath(prev);
          const nb = neighbors(u);
          for (let k = nb.length - 1; k >= 0; k--) {
            const v = nb[k];
            if (walls[v] || seen[v]) continue;
            prev[v] = u; frontier[v] = 1; st.push(v);
          }
        }
        return null;
      },
      *dijkstra() { return yield* best(false); },
      *astar() { return yield* best(true); }
    };

    function* best(useH) {
      const dist = new Float64Array(N).fill(Infinity);
      const prev = new Int32Array(N).fill(-1);
      const done = new Uint8Array(N);
      const pq = new Heap();
      dist[start] = 0;
      pq.push(start, useH ? manhattan(start) : 0);
      while (pq.size) {
        const u = pq.pop();
        if (done[u]) continue;
        done[u] = 1;
        yield u;
        if (u === end) return buildPath(prev);
        for (const v of neighbors(u)) {
          if (walls[v] || done[v]) continue;
          const nd = dist[u] + weight(v);
          if (nd < dist[v]) {
            dist[v] = nd; prev[v] = u; frontier[v] = 1;
            pq.push(v, useH ? nd + manhattan(v) * 1.0001 : nd);
          }
        }
      }
      return null;
    }

    function updateStats() {
      out.visited.textContent = count;
      if (result) {
        out.steps.textContent = result.steps;
        out.cost.textContent = result.cost;
      } else if (searched && !running) {
        out.steps.textContent = '—';
        out.cost.textContent = 'sem caminho';
      } else {
        out.steps.textContent = '—';
        out.cost.textContent = '—';
      }
    }

    function solveInstant() {
      resetSearch();
      const g = ALGOS[algo.get()]();
      for (;;) {
        const r = g.next();
        if (r.done) { result = r.value; break; }
        order[r.value] = count++;
        frontier[r.value] = 0;
      }
      count = count || 0;
      pathT = 1;
      updateStats();
      draw(true);
    }

    function run() {
      if (carving) return;
      stop();
      resetSearch();
      searched = true;
      if (reduce) { solveInstant(); return; }
      gen = ALGOS[algo.get()]();
      running = true;
      runBtn.textContent = 'Parar';
      const per = Math.max(2, Math.round(N / 300));
      const step = () => {
        if (!running) return;
        for (let k = 0; k < per; k++) {
          const r = gen.next();
          if (r.done) {
            result = r.value;
            stop();
            animatePath();
            break;
          }
          order[r.value] = count++;
          frontier[r.value] = 0;
        }
        updateStats();
        draw();
        if (running) raf = requestAnimationFrame(step);
      };
      step();
    }

    function animatePath() {
      updateStats();
      if (!result) { draw(true); return; }
      const t0 = performance.now(), dur = Math.min(1400, 300 + result.steps * 12);
      const step = now => {
        pathT = Math.min(1, (now - t0) / dur);
        draw(true);
        if (pathT < 1 && !running) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function cellRect(i) {
      return [ox + (i % cols) * cs, oy + ((i / cols) | 0) * cs];
    }

    function draw(settled = false) {
      if (!walls) return;
      ctx.clearRect(0, 0, W, H);
      const g = cs > 14 ? 1 : .5;
      for (let i = 0; i < N; i++) {
        const [x, y] = cellRect(i);
        if (walls[i]) {
          ctx.fillStyle = FG(.13);
          ctx.fillRect(x + g / 2, y + g / 2, cs - g, cs - g);
          continue;
        }
        if (order[i] >= 0) {
          const age = count - order[i];
          const a = settled ? .12 : .1 + .4 * Math.exp(-age / 70);
          ctx.fillStyle = ACC(a);
          ctx.fillRect(x + g / 2, y + g / 2, cs - g, cs - g);
        } else if (frontier[i]) {
          ctx.fillStyle = ACC(.7);
          ctx.fillRect(x + cs / 2 - 1.5, y + cs / 2 - 1.5, 3, 3);
        }
        if (mud[i]) {
          ctx.fillStyle = FG(.28);
          const q = cs / 4;
          ctx.fillRect(x + q - .6, y + q - .6, 1.2, 1.2);
          ctx.fillRect(x + 3 * q - .6, y + q - .6, 1.2, 1.2);
          ctx.fillRect(x + 2 * q - .6, y + 2 * q - .6, 1.2, 1.2);
          ctx.fillRect(x + q - .6, y + 3 * q - .6, 1.2, 1.2);
          ctx.fillRect(x + 3 * q - .6, y + 3 * q - .6, 1.2, 1.2);
        }
      }

      if (carving && carveHead >= 0) {
        const [x, y] = cellRect(carveHead);
        ctx.fillStyle = ACC(.9);
        ctx.fillRect(x, y, cs, cs);
      }

      if (result && pathT > 0) {
        const p = result.path;
        const upto = pathT * (p.length - 1);
        const whole = Math.floor(upto);
        ctx.beginPath();
        for (let k = 0; k <= whole; k++) {
          const [x, y] = cellRect(p[k]);
          if (k === 0) ctx.moveTo(x + cs / 2, y + cs / 2); else ctx.lineTo(x + cs / 2, y + cs / 2);
        }
        if (whole < p.length - 1) {
          const [x1, y1] = cellRect(p[whole]);
          const [x2, y2] = cellRect(p[whole + 1]);
          const f = upto - whole;
          ctx.lineTo(x1 + (x2 - x1) * f + cs / 2, y1 + (y2 - y1) * f + cs / 2);
        }
        ctx.strokeStyle = FG(.95);
        ctx.lineWidth = Math.max(2, cs * .2);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      const [sx, sy] = cellRect(start);
      ctx.beginPath();
      ctx.arc(sx + cs / 2, sy + cs / 2, cs * .34, 0, Math.PI * 2);
      ctx.fillStyle = FG(1);
      ctx.fill();
      const [ex, ey] = cellRect(end);
      ctx.fillStyle = ACC(.3);
      ctx.fillRect(ex + 2, ey + 2, cs - 4, cs - 4);
      ctx.strokeStyle = ACC(1);
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 2.5, ey + 2.5, cs - 5, cs - 5);
    }

    /* Edição com o ponteiro: paredes, início e fim */
    let drag = null;
    const cellAt = e => {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left - ox) / cs);
      const y = Math.floor((e.clientY - r.top - oy) / cs);
      return x < 0 || y < 0 || x >= cols || y >= rows ? -1 : idx(x, y);
    };
    const afterEdit = () => { if (searched) solveInstant(); else draw(); };
    const apply = i => {
      if (i < 0) return;
      if (drag === 'start') { if (!walls[i] && i !== end && i !== start) { start = i; afterEdit(); } }
      else if (drag === 'end') { if (!walls[i] && i !== start && i !== end) { end = i; afterEdit(); } }
      else if (i !== start && i !== end) {
        const want = drag === 'wall' ? 1 : 0;
        if (walls[i] !== want) { walls[i] = want; if (want) mud[i] = 0; afterEdit(); }
      }
    };
    canvas.addEventListener('pointerdown', e => {
      if (carving) return;
      const i = cellAt(e);
      if (i < 0) return;
      if (running) stop();
      canvas.setPointerCapture(e.pointerId);
      drag = i === start ? 'start' : i === end ? 'end' : walls[i] ? 'erase' : 'wall';
      apply(i);
    });
    canvas.addEventListener('pointermove', e => {
      const i = cellAt(e);
      if (!drag) {
        if (!document.documentElement.classList.contains('has-cursor')) canvas.style.cursor = (i === start || i === end) ? 'grab' : 'crosshair';
        return;
      }
      apply(i);
    });
    const release = () => { drag = null; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    runBtn.addEventListener('click', () => (running ? stop() : run()));
    newBtn.addEventListener('click', () => generate(false));

    return {
      resize,
      run,
      setAlgo: v => algo.set(v),
      get ready() { return !!walls && !carving; },
      get searched() { return searched; }
    };
  })();

  /* ==========================================================================
     Ordenação
     ========================================================================== */
  const sort = (() => {
    const canvas = $('[data-sort-canvas]');
    const ctx = canvas.getContext('2d');
    const out = { cmp: $('[data-sort-cmp]'), writes: $('[data-sort-writes]'), big: $('[data-sort-big]') };
    const runBtn = $('[data-sort-run]');
    const shuffleBtn = $('[data-sort-shuffle]');
    const speed = $('[data-sort-speed]');
    const BIG = { bubble: 'O(n²)', insertion: 'O(n²)', selection: 'O(n²)', merge: 'O(n log n)', quick: 'O(n log n) médio', heap: 'O(n log n)' };
    const SPEEDS = [1, 2, 3, 4, 6, 9, 14, 22, 34, 55];

    let W = 0, H = 0, n = 0, arr = [], cmp = 0, writes = 0;
    let running = false, raf = 0, gen = null, mark = null, sorted = false, sweep = -1;

    const algo = radio($('[data-sort-algo]'), v => {
      out.big.textContent = BIG[v];
      if (running) { stop(); mark = null; draw(); }
    });
    out.big.textContent = BIG[algo.get()];

    function resize() {
      const s = fitCanvas(canvas, ctx);
      if (!s) return;
      W = s.w; H = s.h;
      const want = W < 600 ? 32 : 64;
      if (want !== n) { n = want; shuffle(); } else draw();
    }

    function stats() {
      out.cmp.textContent = cmp;
      out.writes.textContent = writes;
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      runBtn.textContent = 'Ordenar';
    }

    function shuffle() {
      stop();
      arr = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = n - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      cmp = writes = 0;
      sorted = false; sweep = -1; mark = null;
      stats();
      draw();
    }

    const swap = (a, i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; writes += 2; };

    const ALGOS = {
      *bubble(a) {
        for (let i = 0; i < a.length; i++) {
          let any = false;
          for (let j = 0; j < a.length - 1 - i; j++) {
            cmp++; yield ['cmp', j, j + 1];
            if (a[j] > a[j + 1]) { swap(a, j, j + 1); any = true; yield ['swap', j, j + 1]; }
          }
          if (!any) break;
        }
      },
      *insertion(a) {
        for (let i = 1; i < a.length; i++) {
          for (let j = i; j > 0; j--) {
            cmp++; yield ['cmp', j - 1, j];
            if (a[j - 1] <= a[j]) break;
            swap(a, j - 1, j); yield ['swap', j - 1, j];
          }
        }
      },
      *selection(a) {
        for (let i = 0; i < a.length - 1; i++) {
          let m = i;
          for (let j = i + 1; j < a.length; j++) {
            cmp++; yield ['cmp', m, j];
            if (a[j] < a[m]) m = j;
          }
          if (m !== i) { swap(a, i, m); yield ['swap', i, m]; }
        }
      },
      *merge(a) {
        const aux = a.slice();
        function* ms(lo, hi) {
          if (hi <= lo) return;
          const mid = (lo + hi) >> 1;
          yield* ms(lo, mid);
          yield* ms(mid + 1, hi);
          for (let k = lo; k <= hi; k++) aux[k] = a[k];
          let i = lo, j = mid + 1;
          for (let k = lo; k <= hi; k++) {
            if (i > mid) a[k] = aux[j++];
            else if (j > hi) a[k] = aux[i++];
            else {
              cmp++; yield ['cmp', k, j];
              a[k] = aux[j] < aux[i] ? aux[j++] : aux[i++];
            }
            writes++; yield ['set', k, k];
          }
        }
        yield* ms(0, a.length - 1);
      },
      *quick(a) {
        function* qs(lo, hi) {
          if (lo >= hi) return;
          const mid = (lo + hi) >> 1;
          swap(a, mid, hi); yield ['swap', mid, hi];
          const p = a[hi];
          let i = lo;
          for (let j = lo; j < hi; j++) {
            cmp++; yield ['cmp', j, hi];
            if (a[j] < p) { if (i !== j) { swap(a, i, j); yield ['swap', i, j]; } i++; }
          }
          swap(a, i, hi); yield ['swap', i, hi];
          yield* qs(lo, i - 1);
          yield* qs(i + 1, hi);
        }
        yield* qs(0, a.length - 1);
      },
      *heap(a) {
        const len = a.length;
        function* sift(root, last) {
          for (;;) {
            const c = root * 2 + 1;
            if (c > last) return;
            let m = root;
            cmp++; yield ['cmp', m, c];
            if (a[m] < a[c]) m = c;
            if (c + 1 <= last) { cmp++; yield ['cmp', m, c + 1]; if (a[m] < a[c + 1]) m = c + 1; }
            if (m === root) return;
            swap(a, root, m); yield ['swap', root, m];
            root = m;
          }
        }
        for (let s = (len - 2) >> 1; s >= 0; s--) yield* sift(s, len - 1);
        for (let last = len - 1; last > 0; last--) {
          swap(a, 0, last); yield ['swap', 0, last];
          yield* sift(0, last - 1);
        }
      }
    };

    function finish() {
      stop();
      sorted = true;
      mark = null;
      if (reduce) { sweep = n; draw(); return; }
      sweep = 0;
      const step = () => {
        sweep += Math.max(1, n / 40);
        draw();
        if (sweep < n) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function run() {
      if (sorted) shuffle();
      stop();
      cmp = writes = 0;
      gen = ALGOS[algo.get()](arr);
      running = true;
      runBtn.textContent = 'Parar';
      if (reduce) {
        while (!gen.next().done);
        stats();
        finish();
        return;
      }
      const step = () => {
        if (!running) return;
        const per = SPEEDS[(+speed.value || 5) - 1];
        for (let k = 0; k < per; k++) {
          const r = gen.next();
          if (r.done) { stats(); finish(); return; }
          mark = r.value;
        }
        stats();
        draw();
        raf = requestAnimationFrame(step);
      };
      step();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const padX = 20, padTop = 24, padBottom = 20;
      const bw = (W - padX * 2) / n;
      const gap = bw > 8 ? 2 : 1;
      const maxH = H - padTop - padBottom;
      ctx.fillStyle = FG(.06);
      ctx.fillRect(padX, H - padBottom, W - padX * 2, 1);
      for (let i = 0; i < n; i++) {
        const h = (arr[i] / n) * maxH;
        const x = padX + i * bw, y = H - padBottom - h;
        let color = FG(.26);
        if (sweep >= 0) color = i < sweep ? FG(.8) : FG(.26);
        if (mark && (i === mark[1] || i === mark[2])) color = mark[0] === 'cmp' ? FG(.95) : ACC(1);
        ctx.fillStyle = color;
        ctx.fillRect(x + gap / 2, y, bw - gap, h);
      }
    }

    runBtn.addEventListener('click', () => (running ? stop() : run()));
    shuffleBtn.addEventListener('click', shuffle);

    return { resize, run, setAlgo: v => { algo.set(v); out.big.textContent = BIG[v]; } };
  })();

  /* ---------- Abas ---------- */
  const tabs = $$('.lab-tab', lab);
  const line = $('.lab-tab-line', lab);
  const moveLine = () => {
    const cur = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    if (!cur) return;
    line.style.width = `${cur.offsetWidth}px`;
    line.style.transform = `translateX(${cur.offsetLeft}px)`;
  };
  function selectTab(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    moveLine();
    (tab.id === 'tab-path' ? path : sort).resize();
  }
  tabs.forEach(t => t.addEventListener('click', () => selectTab(t)));
  $('.lab-tabs', lab).addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    selectTab(n);
    n.focus();
  });

  const ro = new ResizeObserver(() => {
    moveLine();
    if (!$('#panel-path').hidden) path.resize();
    if (!$('#panel-sort').hidden) sort.resize();
  });
  ro.observe(lab);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveLine);

  /* Primeira vez que o laboratório aparece na tela, roda uma busca sozinho. */
  let demoDone = false;
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting || demoDone) return;
    demoDone = true;
    obs.disconnect();
    setTimeout(() => { if (!path.searched && path.ready && !$('#panel-path').hidden) path.run(); }, 700);
  }, { threshold: .45 }).observe($('.lab-stage', lab));

  /* Comandos vindos da paleta */
  document.addEventListener('lab:run', e => {
    const { tab, algo: a } = e.detail || {};
    demoDone = true;
    const t = tab === 'sort' ? $('#tab-sort') : $('#tab-path');
    selectTab(t);
    const mod = tab === 'sort' ? sort : path;
    if (a) mod.setAlgo(a);
    setTimeout(() => mod.run(), 650);
  });
})();
