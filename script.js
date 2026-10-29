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
  const WHATSAPP = '5512996013011';

  if (root && !reduce) root.classList.add('anim');

  // ---------- ondas interativas da hero ----------
  const mouse = { x: -1000, y: -1000 };
  const target = { x: -1000, y: -1000 };
  function onMove(e) {
    if (!wave) return;
    const r = wave.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    target.x = t.clientX - r.left;
    target.y = t.clientY - r.top;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  function drawWaves() {
    if (!wave) return;
    const w = wave.clientWidth, h = wave.clientHeight;
    if (!w || !h) return;
    if (wave.width !== w || wave.height !== h) { wave.width = w; wave.height = h; }
    const ctx = wave.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    mouse.x += (target.x - mouse.x) * 0.1;
    mouse.y += (target.y - mouse.y) * 0.1;
    const time = reduce ? 0 : Date.now() * 0.02;
    const lines = 15, segs = 100, amp = 40, rad = 150, str = 80;
    for (let i = 0; i < lines; i++) {
      const baseY = (h / lines) * i + h / lines / 2;
      const off = i * 0.5;
      const op = 0.05 + (i / lines) * 0.22;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(248,200,248,' + op + ')');
      g.addColorStop(0.5, 'rgba(170,170,170,' + op + ')');
      g.addColorStop(1, 'rgba(200,240,248,' + op + ')');
      ctx.beginPath();
      ctx.lineWidth = 1 + i / 5;
      ctx.strokeStyle = g;
      for (let x = 0; x <= segs; x++) {
        const xp = (w / segs) * x;
        let yp = baseY + Math.sin(x * 0.1 + time * 0.05 + off) * amp;
        yp += Math.cos(x * 0.05 - time * 0.03) * (amp / 2);
        const dx = xp - mouse.x, dy = yp - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < rad) {
          const f = (rad - dist) / rad;
          yp += Math.sin(Math.atan2(dy, dx)) * f * str;
        }
        if (x === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
      }
      ctx.stroke();
    }
  }

  // ---------- efeitos ligados ao scroll ----------
  let curveP = 0;
  const reveals = root ? root.querySelectorAll('[data-reveal]') : [];
  const fades = root ? root.querySelectorAll('[data-fade]') : [];
  const drawWrap = root && root.querySelector('[data-draw-wrap]');
  const drawPath = root && root.querySelector('[data-draw]');
  const hSec = root && root.querySelector('[data-hsec]');
  const hTrack = root && root.querySelector('[data-htrack]');

  function frame() {
    const vh = window.innerHeight || 900;
    drawWaves();

    // hero: parallax e fade
    let scrolled = 0;
    if (hero) {
      scrolled = Math.max(0, -hero.getBoundingClientRect().top);
      if (heroInner && !reduce) {
        const k = Math.min(1, scrolled / ((hero.offsetHeight || vh) * 0.8));
        heroInner.style.transform = 'translateY(' + (scrolled * 0.25) + 'px)';
        heroInner.style.opacity = String(1 - k);
      }
    }

    // menu em pílula que encolhe até virar a estrela
    if (nav && navInner) {
      const p = Math.min(scrolled, 300) / 300;
      const full = navInner.scrollWidth + 16;
      nav.style.width = (56 + (full - 56) * (1 - p)) + 'px';
      nav.style.borderRadius = (50 - p * 22) + 'px';
      navInner.style.opacity = String(Math.max(0, 1 - p * 5));
      navInner.style.pointerEvents = p > 0.8 ? 'none' : 'auto';
      if (star) {
        star.style.opacity = String(Math.max(0, (p - 0.5) * 2));
        star.style.transform = 'scale(' + (0.5 + p * 0.5) + ')';
      }
    }
    if (logo) logo.style.height = (34 - Math.min(scrolled, 300) / 300 * 8) + 'px';

    // curva volumétrica que dobra com o scroll
    if (curveSec && curves[3]) {
      const top = curveSec.getBoundingClientRect().top;
      const t = Math.max(0, Math.min(1, 1 - (top - vh * 0.4) / vh));
      curveP += (t - curveP) * 0.18;
      const p = curveP;
      const yb = 400, ty = yb - p * 500, by = yb - p * 150, cx = 400;
      const d = 'M -200 ' + yb + ' C 300 ' + yb + ', ' + cx + ' ' + ty + ', 720 ' + ty +
        ' C ' + (1440 - cx) + ' ' + ty + ', 1140 ' + yb + ', 1640 ' + yb +
        ' L 1640 ' + (yb + 20) + ' C 1140 ' + (yb + 20) + ', ' + (1440 - cx) + ' ' + by + ', 720 ' + by +
        ' C ' + cx + ' ' + by + ', 300 ' + (yb + 20) + ', -200 ' + (yb + 20) + ' Z';
      curves.forEach((el) => { if (el) el.setAttribute('d', d); });
    }

    // palavras que sobem uma a uma
    for (let i = 0; i < reveals.length; i++) {
      const t = reveals[i].getBoundingClientRect().top;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.95 - t) / (vh * 0.6)));
      reveals[i].style.setProperty('--p', p.toFixed(3));
    }

    // blocos que aparecem ao entrar na tela
    for (let i = 0; i < fades.length; i++) {
      if (fades[i].getBoundingClientRect().top < vh * 0.88) fades[i].classList.add('in');
    }

    // linha do sistema que se desenha
    if (drawWrap && drawPath) {
      const t = drawWrap.getBoundingClientRect().top;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - t) / (vh * 0.5)));
      drawPath.setAttribute('stroke-dashoffset', String(1 - p));
    }

    // trilho de benefícios e imagens que anda para a direita com o scroll
    if (hSec && hTrack) {
      const r = hSec.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      const q = Math.max(0, Math.min(1, p * 1.4 - 0.2));
      const max = Math.max(0, hTrack.scrollWidth - hSec.clientWidth);
      hTrack.style.transform = 'translateX(' + (-(1 - q) * max) + 'px)';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

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
