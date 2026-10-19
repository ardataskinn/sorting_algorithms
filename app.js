const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const randomArray = n => Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95));

function parseInput(str) {
  const vals = str.split(/[\s,;]+/).map(t => parseInt(t, 10)).filter(v => Number.isFinite(v));
  return vals.map(v => Math.max(0, Math.min(999, v))).slice(0, 50);
}

const delayOf = speed => Math.max(4, Math.round(800 * Math.pow(0.95, speed)));

function highlight(code) {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/(#include)|\b(void|int|bool|double|auto|vector)\b|\b(for|while|if|else|return|break|using|namespace|std)\b|\b(\d+)\b/g, (m, pp, ty, kw, nu) => {
    if (pp) return `<span class="pp">${m}</span>`;
    if (ty) return `<span class="ty">${m}</span>`;
    if (kw) return `<span class="kw">${m}</span>`;
    return `<span class="nu">${m}</span>`;
  });
}

class Viz {
  constructor(el) {
    this.el = el;
    this.mode = 'bars';
    this.arr = [];
    this.els = [];
  }

  setMode(m) {
    this.mode = m;
    this.el.classList.toggle('mode-bars', m === 'bars');
    this.el.classList.toggle('mode-nums', m === 'nums');
    this.fit();
  }

  load(arr) {
    this.arr = arr.slice();
    this.max = Math.max(...arr, 1);
    this.el.innerHTML = '';
    this.els = this.arr.map(() => {
      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = '<div class="blk"><span></span></div>';
      this.el.appendChild(d);
      return d;
    });
    this.els.forEach((d, i) => {
      this.place(d, i);
      this.paint(d, this.arr[i]);
    });
    this.pivot = -1;
    this.range = null;
    this.stats = { cmp: 0, swap: 0, write: 0, step: 0 };
    this.setMode(this.mode);
  }

  fit() {
    const n = this.arr.length || 1;
    const w = (this.el.clientWidth || 600) / n;
    this.el.classList.toggle('labels', w >= 24);
    this.el.style.setProperty('--fs', (w >= 44 ? 20 : 10) + 'px');
  }

  place(d, i) {
    const w = 100 / this.arr.length;
    d.style.left = i * w + '%';
    d.style.width = w + '%';
  }

  paint(d, v) {
    d.style.setProperty('--h', Math.max(2, (v / this.max) * 100) + '%');
    d.querySelector('span').textContent = v;
  }

  clear() {
    for (const d of this.els) d.classList.remove('cmp', 'swap', 'write', 'pivot', 'dim');
  }

  apply(op) {
    switch (op.t) {
      case 'range':
        this.range = [op.l, op.r];
        this.pivot = -1;
        return false;
      case 'pivot':
        this.pivot = op.i;
        return false;
      case 'done':
        this.els[op.i].classList.add('done');
        return false;
      case 'fin':
        this.range = null;
        this.pivot = -1;
        this.clear();
        this.els.forEach(d => d.classList.add('done'));
        return false;
    }
    this.clear();
    this.stats.step++;
    if (this.range) {
      this.els.forEach((d, i) => {
        if (i < this.range[0] || i > this.range[1]) d.classList.add('dim');
      });
    }
    if (this.pivot >= 0) this.els[this.pivot].classList.add('pivot');
    if (op.t === 'cmp') {
      this.stats.cmp++;
      this.els[op.i].classList.add('cmp');
      this.els[op.j].classList.add('cmp');
    } else if (op.t === 'swap') {
      this.stats.swap++;
      const { i, j } = op;
      [this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]];
      [this.els[i], this.els[j]] = [this.els[j], this.els[i]];
      this.place(this.els[i], i);
      this.place(this.els[j], j);
      this.els[i].classList.add('swap');
      this.els[j].classList.add('swap');
    } else if (op.t === 'set') {
      this.stats.write++;
      this.arr[op.i] = op.v;
      this.paint(this.els[op.i], op.v);
      this.els[op.i].classList.add('write');
    } else if (op.t === 'read') {
      this.els[op.i].classList.add('cmp');
    }
    return true;
  }

  setDuration(ms) {
    this.el.style.setProperty('--dur', Math.min(250, Math.round(ms * 0.85)) + 'ms');
  }
}

class Runner {
  constructor(viz, key) {
    this.viz = viz;
    this.gen = ALGOS[key].gen(viz.arr.slice());
    this.finished = false;
  }

  tick() {
    if (this.finished) return false;
    while (true) {
      const r = this.gen.next();
      if (r.done) {
        this.finished = true;
        return false;
      }
      const visible = this.viz.apply(r.value);
      if (r.value.t === 'fin') {
        this.finished = true;
        return false;
      }
      if (visible) return true;
    }
  }
}

function statsHtml(s) {
  return `<span>KARŞILAŞTIRMA <b>${s.cmp}</b></span><span>TAKAS <b>${s.swap}</b></span><span>YAZMA <b>${s.write}</b></span><span>ADIM <b>${s.step}</b></span>`;
}

function showPage(id) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  if (id === 'algorithms') single.viz.fit();
  if (id === 'compare') {
    compare.vizA.fit();
    compare.vizB.fit();
  }
  window.scrollTo(0, 0);
}

$$('.nav-btn').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));

$$('.tab-btn').forEach(b => b.addEventListener('click', () => {
  $$('.tab-btn').forEach(x => x.classList.toggle('active', x === b));
  $$('.cat-panel').forEach(p => p.classList.toggle('active', p.id === 'cat-' + b.dataset.cat));
}));

const single = {
  key: 'bubble',
  base: randomArray(16),
  viz: new Viz($('#vizSingle')),
  runner: null,
  timer: null,
  playing: false,

  init() {
    const picker = $('#algoPicker');
    Object.entries(ALGOS).forEach(([key, a]) => {
      const b = document.createElement('button');
      b.textContent = a.name.replace(' SORT', '');
      b.dataset.key = key;
      b.addEventListener('click', () => this.select(key));
      picker.appendChild(b);
    });
    $('#playBtn').addEventListener('click', () => this.toggle());
    $('#stepBtn').addEventListener('click', () => this.step());
    $('#resetBtn').addEventListener('click', () => this.reset());
    $('#randomBtn').addEventListener('click', () => {
      this.base = randomArray(+$('#sizeIn').value);
      this.reset();
    });
    $('#sizeIn').addEventListener('input', e => {
      $('#sizeVal').textContent = e.target.value;
      this.base = randomArray(+e.target.value);
      this.reset();
    });
    $('#speedIn').addEventListener('input', () => this.viz.setDuration(this.delay()));
    $('#useCustom').addEventListener('click', () => {
      const vals = parseInput($('#customIn').value);
      if (vals.length < 2) return flash($('#customIn'));
      this.base = vals;
      $('#sizeIn').value = vals.length;
      $('#sizeVal').textContent = vals.length;
      this.reset();
    });
    this.select(this.key);
  },

  delay() {
    return delayOf(+$('#speedIn').value);
  },

  select(key) {
    this.key = key;
    const a = ALGOS[key];
    $$('#algoPicker button').forEach(b => b.classList.toggle('active', b.dataset.key === key));
    $('#algoName').textContent = a.name;
    $('#algoTags').innerHTML = a.tags.map(t => `<span class="tag">${t}</span>`).join('');
    $('#algoDesc').textContent = a.desc;
    $('#algoSteps').innerHTML = a.steps.map(s => `<li>${s}</li>`).join('');
    const row = (k, [v, c]) => `<tr><td>${k}</td><td class="${c}">${v}</td></tr>`;
    $('#algoCx').innerHTML =
      row('EN İYİ DURUM', a.cx.best) +
      row('ORTALAMA DURUM', a.cx.avg) +
      row('EN KÖTÜ DURUM', a.cx.worst) +
      row('EKSTRA HAFIZA', a.cx.space) +
      row('STABLE', a.stable ? ['EVET', 'good'] : ['HAYIR', 'bad']) +
      row('IN-PLACE', a.inplace ? ['EVET', 'good'] : ['HAYIR', 'bad']);
    $('#algoCode').innerHTML = highlight(a.code);
    this.reset();
  },

  reset() {
    this.pause();
    this.viz.load(this.base);
    this.viz.setDuration(this.delay());
    this.runner = new Runner(this.viz, this.key);
    this.render();
  },

  render() {
    $('#statsSingle').innerHTML = statsHtml(this.viz.stats);
    $('#playBtn').textContent = this.playing ? 'DURAKLAT' : this.runner.finished ? 'TEKRAR' : 'BAŞLAT';
  },

  toggle() {
    if (this.playing) return this.pause();
    if (this.runner.finished) this.reset();
    this.playing = true;
    this.loop();
    this.render();
  },

  loop() {
    if (!this.playing) return;
    const more = this.runner.tick();
    this.render();
    if (!more) return this.pause();
    this.timer = setTimeout(() => this.loop(), this.delay());
  },

  pause() {
    this.playing = false;
    clearTimeout(this.timer);
    if (this.runner) this.render();
  },

  step() {
    this.pause();
    if (this.runner.finished) return;
    this.runner.tick();
    this.render();
  }
};

const compare = {
  base: randomArray(20),
  vizA: new Viz($('#vizA')),
  vizB: new Viz($('#vizB')),
  timer: null,
  playing: false,

  init() {
    const opts = Object.entries(ALGOS).map(([k, a]) => `<option value="${k}">${a.name}</option>`).join('');
    $('#cmpA').innerHTML = opts;
    $('#cmpB').innerHTML = opts;
    $('#cmpA').value = 'bubble';
    $('#cmpB').value = 'quick';
    $('#cmpA').addEventListener('change', () => this.reset());
    $('#cmpB').addEventListener('change', () => this.reset());
    $('#cmpPlay').addEventListener('click', () => this.toggle());
    $('#cmpReset').addEventListener('click', () => this.reset());
    $('#cmpRandom').addEventListener('click', () => {
      this.base = randomArray(+$('#cmpSize').value);
      this.reset();
    });
    $('#cmpSize').addEventListener('input', e => {
      $('#cmpSizeVal').textContent = e.target.value;
      this.base = randomArray(+e.target.value);
      this.reset();
    });
    $('#cmpSpeed').addEventListener('input', () => {
      this.vizA.setDuration(this.delay());
      this.vizB.setDuration(this.delay());
    });
    $('#cmpUseCustom').addEventListener('click', () => {
      const vals = parseInput($('#cmpCustom').value);
      if (vals.length < 2) return flash($('#cmpCustom'));
      this.base = vals;
      $('#cmpSize').value = vals.length;
      $('#cmpSizeVal').textContent = vals.length;
      this.reset();
    });
    this.reset();
  },

  delay() {
    return delayOf(+$('#cmpSpeed').value);
  },

  reset() {
    this.pause();
    const ka = $('#cmpA').value;
    const kb = $('#cmpB').value;
    $('#cmpNameA').textContent = ALGOS[ka].name;
    $('#cmpNameB').textContent = ALGOS[kb].name;
    this.vizA.load(this.base);
    this.vizB.load(this.base);
    this.vizA.setDuration(this.delay());
    this.vizB.setDuration(this.delay());
    this.ra = new Runner(this.vizA, ka);
    this.rb = new Runner(this.vizB, kb);
    $('#cmpResult').classList.remove('show');
    this.render();
  },

  render() {
    $('#statsA').innerHTML = statsHtml(this.vizA.stats);
    $('#statsB').innerHTML = statsHtml(this.vizB.stats);
    const done = this.ra.finished && this.rb.finished;
    $('#cmpPlay').textContent = this.playing ? 'DURAKLAT' : done ? 'TEKRAR' : 'BAŞLAT';
  },

  toggle() {
    if (this.playing) return this.pause();
    if (this.ra.finished && this.rb.finished) this.reset();
    this.playing = true;
    this.loop();
  },

  loop() {
    if (!this.playing) return;
    this.ra.tick();
    this.rb.tick();
    this.render();
    if (this.ra.finished && this.rb.finished) {
      this.pause();
      return this.finish();
    }
    this.timer = setTimeout(() => this.loop(), this.delay());
  },

  pause() {
    this.playing = false;
    clearTimeout(this.timer);
    if (this.ra) this.render();
  },

  finish() {
    const a = this.vizA.stats.step;
    const b = this.vizB.stats.step;
    const na = $('#cmpNameA').textContent;
    const nb = $('#cmpNameB').textContent;
    let msg;
    if (a === b) msg = `BERABERE! İKİSİ DE ${a} ADIMDA BİTİRDİ`;
    else if (a < b) msg = `KAZANAN: ${na} (${a} ADIM / ${nb}: ${b} ADIM)`;
    else msg = `KAZANAN: ${nb} (${b} ADIM / ${na}: ${a} ADIM)`;
    $('#cmpResult').textContent = msg;
    $('#cmpResult').classList.add('show');
  }
};

function flash(el) {
  el.style.borderColor = 'var(--red)';
  setTimeout(() => (el.style.borderColor = ''), 600);
}

$$('.toggle').forEach(b => b.addEventListener('click', () => {
  const target = b.dataset.target;
  $$(`.toggle[data-target="${target}"]`).forEach(x => x.classList.toggle('active', x === b));
  if (target === 'single') single.viz.setMode(b.dataset.mode);
  else {
    compare.vizA.setMode(b.dataset.mode);
    compare.vizB.setMode(b.dataset.mode);
  }
}));

$$('[data-algo]').forEach(a => a.addEventListener('click', () => {
  single.select(a.dataset.algo);
  showPage('algorithms');
}));

window.addEventListener('resize', () => {
  single.viz.fit();
  compare.vizA.fit();
  compare.vizB.fit();
});

single.init();
compare.init();
