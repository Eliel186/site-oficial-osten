// Site oficial Osten: efeitos de scroll, ondas da hero e formulário de análise.
(function () {
  const $ = (id) => document.getElementById(id);
  const ref = (name) => document.querySelector('[data-ref="' + name + '"]');
  const root = ref('Root');
  const logo = ref('Logo');
  const nav = ref('Nav');
  const navInner = ref('NavInner');
  const star = ref('Star');
  const hero = ref('Hero');
  const heroInner = ref('HeroInner');
  const wave = ref('Wave');
  const curveSec = ref('CurveSec');
  const curves = ['C1', 'C2', 'C3', 'C4'].map(ref);
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Celular: menos linhas nas ondas, 30 quadros por segundo e sem as camadas de brilho da curva
  const mobile = window.matchMedia && window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const WHATSAPP = '5512996013011';

  if (root && !reduce) root.classList.add('anim');

  // Liga e desliga cada efeito conforme ele entra ou sai da tela
  const visivel = new Map();
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => visivel.set(e.target, e.isIntersecting));
        acordar();
      }, { rootMargin: '200px 0px' })
    : null;
  const observar = (el) => { if (!el) return; visivel.set(el, !io); if (io) io.observe(el); };
  const naTela = (el) => !!el && visivel.get(el) === true;

  // ---------- ondas interativas da hero ----------
  const mouse = { x: -1000, y: -1000 };
  const target = { x: -1000, y: -1000 };
  let waveRect = null;
  function onMove(e) {
    if (!wave || !naTela(hero)) return;
    const t = e.touches ? e.touches[0] : e;
    if (!waveRect) waveRect = wave.getBoundingClientRect();
    target.x = t.clientX - waveRect.left;
    target.y = t.clientY - waveRect.top;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('resize', () => { waveRect = null; waveSize = null; }, { passive: true });

  const LINES = mobile ? 8 : 15;
  const SEGS = mobile ? 40 : 100;
  let waveSize = null, ctx = null, gradients = [];
  function prepWaves() {
    const w = wave.clientWidth, h = wave.clientHeight;
    if (!w || !h) return false;
    wave.width = w;
    wave.height = h;
    ctx = wave.getContext('2d');
    // Os degradês só mudam com o tamanho: criados uma vez, não a cada quadro
    gradients = [];
    for (let i = 0; i < LINES; i++) {
      const op = 0.05 + (i / LINES) * 0.22;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(248,200,248,' + op + ')');
      g.addColorStop(0.5, 'rgba(170,170,170,' + op + ')');
      g.addColorStop(1, 'rgba(200,240,248,' + op + ')');
      gradients.push(g);
    }
    waveSize = { w, h };
    return true;
  }

  function drawWaves() {
    if (!wave) return;
    if (!waveSize && !prepWaves()) return;
    const { w, h } = waveSize;
    ctx.clearRect(0, 0, w, h);
    mouse.x += (target.x - mouse.x) * 0.1;
    mouse.y += (target.y - mouse.y) * 0.1;
    const time = reduce ? 0 : Date.now() * 0.02;
    const amp = 40, rad = 150, str = 80;
    for (let i = 0; i < LINES; i++) {
      const baseY = (h / LINES) * i + h / LINES / 2;
      const off = i * 0.5;
      ctx.beginPath();
      ctx.lineWidth = 1 + (i * 15 / LINES) / 5;
      ctx.strokeStyle = gradients[i];
      for (let x = 0; x <= SEGS; x++) {
        const k = (x / SEGS) * 100;
        const xp = (w / SEGS) * x;
        let yp = baseY + Math.sin(k * 0.1 + time * 0.05 + off) * amp;
        yp += Math.cos(k * 0.05 - time * 0.03) * (amp / 2);
        const dx = xp - mouse.x, dy = yp - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < rad) yp += (dy / (dist || 1)) * ((rad - dist) / rad) * str;
        if (x === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
      }
      ctx.stroke();
    }
  }

  // ---------- efeitos ligados ao scroll ----------
  let curveP = 0;
  const reveals = root ? Array.from(root.querySelectorAll('[data-reveal]')) : [];
  const lastP = new Map();
  const drawWrap = root && root.querySelector('[data-draw-wrap]');
  const drawPath = root && root.querySelector('[data-draw]');
  const hSec = root && root.querySelector('[data-hsec]');
  const hTrack = root && root.querySelector('[data-htrack]');
  let hMax = null;
  window.addEventListener('resize', () => { hMax = null; }, { passive: true });

  // Camadas de brilho desfocado da curva pesam demais no celular
  if (mobile) curves.slice(0, 3).forEach((el) => { if (el) el.style.display = 'none'; });
  const curvasAtivas = mobile ? curves.slice(3) : curves;

  [hero, curveSec, drawWrap, hSec].concat(reveals).forEach(observar);

  // Blocos que aparecem ao entrar na tela: o navegador avisa, sem medir a cada quadro
  const fades = root ? root.querySelectorAll('[data-fade]') : [];
  if (io && !reduce) {
    const ioFade = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ioFade.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    fades.forEach((el) => ioFade.observe(el));
  } else {
    fades.forEach((el) => el.classList.add('in'));
  }

  let raf = 0, ultimo = 0, scrollY = window.scrollY;
  const intervalo = mobile ? 1000 / 30 : 0;

  function frame(now) {
    raf = 0;
    if (intervalo && now - ultimo < intervalo - 2) { pedirQuadro(); return; }
    ultimo = now;
    const vh = window.innerHeight || 900;
    let continuar = false;

    // 1) Lê todas as posições primeiro
    const heroOn = naTela(hero);
    const heroTop = hero ? hero.getBoundingClientRect().top : 0;
    const heroH = hero ? hero.offsetHeight || vh : vh;
    const curveTop = curveSec && naTela(curveSec) ? curveSec.getBoundingClientRect().top : null;
    const revealTops = reveals.map((el) => (naTela(el) ? el.getBoundingClientRect().top : null));
    const drawTop = drawWrap && naTela(drawWrap) ? drawWrap.getBoundingClientRect().top : null;
    let hRect = null;
    if (hSec && hTrack && naTela(hSec)) {
      hRect = hSec.getBoundingClientRect();
      if (hMax === null) hMax = Math.max(0, hTrack.scrollWidth - hSec.clientWidth);
    }

    // 2) Depois escreve
    if (heroOn) {
      drawWaves();
      continuar = !reduce;
    }
    const scrolled = Math.max(0, -heroTop);
    if (heroInner && !reduce && scrolled < heroH * 1.2) {
      const k = Math.min(1, scrolled / (heroH * 0.8));
      heroInner.style.transform = 'translate3d(0,' + (scrolled * 0.25) + 'px,0)';
      heroInner.style.opacity = String(1 - k);
    }

    // menu em pílula que encolhe até virar a estrela
    if (nav && navInner) {
      const p = Math.min(scrolled, 300) / 300;
      if (p !== frame.navP) {
        frame.navP = p;
        if (!frame.navFull) frame.navFull = navInner.scrollWidth + 16;
        nav.style.width = (56 + (frame.navFull - 56) * (1 - p)) + 'px';
        nav.style.borderRadius = (50 - p * 22) + 'px';
        navInner.style.opacity = String(Math.max(0, 1 - p * 5));
        navInner.style.pointerEvents = p > 0.8 ? 'none' : 'auto';
        if (star) {
          star.style.opacity = String(Math.max(0, (p - 0.5) * 2));
          star.style.transform = 'scale(' + (0.5 + p * 0.5) + ')';
        }
        if (logo) logo.style.height = (34 - p * 8) + 'px';
      }
    }

    // curva volumétrica que dobra com o scroll
    if (curveTop !== null) {
      const t = Math.max(0, Math.min(1, 1 - (curveTop - vh * 0.4) / vh));
      const antes = curveP;
      curveP += (t - curveP) * 0.18;
      if (Math.abs(t - curveP) > 0.001) continuar = true;
      if (Math.abs(curveP - antes) > 0.0005 || !frame.curvaDesenhada) {
        frame.curvaDesenhada = true;
        const p = curveP;
        // No celular a curva é espremida na largura: dobra menos para não virar um pico sobre o texto
        const amp = mobile ? 0.3 : 1;
        const yb = 400, ty = yb - p * 500 * amp, by = yb - p * 150 * amp, cx = 400;
        const d = 'M -200 ' + yb + ' C 300 ' + yb + ', ' + cx + ' ' + ty + ', 720 ' + ty +
          ' C ' + (1440 - cx) + ' ' + ty + ', 1140 ' + yb + ', 1640 ' + yb +
          ' L 1640 ' + (yb + 20) + ' C 1140 ' + (yb + 20) + ', ' + (1440 - cx) + ' ' + by + ', 720 ' + by +
          ' C ' + cx + ' ' + by + ', 300 ' + (yb + 20) + ', -200 ' + (yb + 20) + ' Z';
        curvasAtivas.forEach((el) => { if (el) el.setAttribute('d', d); });
      }
    }

    // palavras que sobem uma a uma
    for (let i = 0; i < reveals.length; i++) {
      if (revealTops[i] === null) continue;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.95 - revealTops[i]) / (vh * 0.6)));
      const v = p.toFixed(3);
      if (lastP.get(reveals[i]) !== v) { lastP.set(reveals[i], v); reveals[i].style.setProperty('--p', v); }
    }

    // linha do sistema que se desenha
    if (drawTop !== null) {
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - drawTop) / (vh * 0.5)));
      drawPath.setAttribute('stroke-dashoffset', String(1 - p));
    }

    // trilho de benefícios que anda para a direita com o scroll
    if (hRect) {
      const p = Math.max(0, Math.min(1, (vh - hRect.top) / (vh + hRect.height)));
      const q = Math.max(0, Math.min(1, p * 1.4 - 0.2));
      hTrack.style.transform = 'translate3d(' + (-(1 - q) * hMax) + 'px,0,0)';
    }

    // Só continua animando sozinho enquanto há algo se mexendo (ondas ou curva assentando)
    if (continuar) pedirQuadro();
  }

  function pedirQuadro() { if (!raf) raf = requestAnimationFrame(frame); }
  function acordar() { pedirQuadro(); }
  window.addEventListener('scroll', () => { if (window.scrollY !== scrollY) { scrollY = window.scrollY; acordar(); } }, { passive: true });
  window.addEventListener('resize', acordar, { passive: true });
  acordar();

  // ---------- vídeo da planta: só baixa e toca quando chega perto da tela ----------
  document.querySelectorAll('video[data-src]').forEach((v) => {
    const carregar = () => { if (!v.src) { v.src = v.getAttribute('data-src'); } };
    if (!io) { carregar(); v.play && v.play().catch(() => {}); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { carregar(); const p = v.play(); if (p) p.catch(() => {}); }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: '0px 0px 80px 0px' }).observe(v);
  });

  // ---------- formulário de análise em 4 etapas ----------
  const questions = [
    { title: 'Qual é o seu faturamento mensal atual?', sub: 'Selecione a opção que melhor descreve sua situação.',
      options: ['Até R$ 10 mil', 'R$ 10 mil a R$ 30 mil', 'R$ 30 mil a R$ 100 mil', 'R$ 100 mil a R$ 300 mil', 'Acima de R$ 300 mil'] },
    { title: 'Qual o principal canal de aquisição de clientes?', sub: 'Onde você encontra a maioria dos seus clientes hoje?',
      options: ['Tráfego pago (Instagram, Google etc.)', 'Orgânico, SEO ou conteúdo', 'Indicação ou parcerias', 'Prospecção ativa', 'Outros canais'] },
    { title: 'Qual o seu principal desafio hoje?', sub: 'Identifique o maior obstáculo para o seu crescimento.',
      options: ['Gerar mais contatos qualificados', 'Converter mais contatos em clientes', 'Reter clientes e diminuir cancelamentos', 'Estruturar o atendimento e a equipe', 'Falta de processos e automação'] },
    { title: 'Qual é o tamanho atual do seu time?', sub: 'Quantas pessoas trabalham no seu negócio.',
      options: ['Trabalho sozinho', '2 a 5 pessoas', '6 a 15 pessoas', 'Mais de 15 pessoas'] }
  ];
  const labels = ['Faturamento', 'Canal', 'Desafio', 'Time'];
  const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D890F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>';
  let step = 0;
  let answers = [];

  function renderForm() {
    const box = $('qBox'), done = $('qDone');
    if (!box || !done) return;
    document.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('on', i < step));
    if (step >= questions.length) {
      box.hidden = true;
      done.hidden = false;
      const msg = 'Olá! Fiz a análise no site da Osten. ' +
        answers.map((a, i) => labels[i] + ': ' + a).join(' | ') + '. Quero receber meu plano de crescimento.';
      $('qWa').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      return;
    }
    box.hidden = false;
    done.hidden = true;
    const q = questions[step];
    $('qStep').textContent = 'PERGUNTA ' + (step + 1) + ' DE ' + questions.length;
    $('qTitle').textContent = q.title;
    $('qSub').textContent = q.sub;
    const opts = $('qOpts');
    opts.innerHTML = '';
    q.options.forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.textContent = label;
      b.insertAdjacentHTML('beforeend', arrow);
      b.addEventListener('click', () => { answers = answers.slice(0, step).concat([label]); step++; renderForm(); });
      opts.appendChild(b);
    });
    $('qBack').hidden = step === 0;
  }
  if ($('qBack')) $('qBack').addEventListener('click', () => { step = Math.max(0, step - 1); answers = answers.slice(0, step); renderForm(); });
  if ($('qRestart')) $('qRestart').addEventListener('click', () => { step = 0; answers = []; renderForm(); });
  renderForm();
})();
