// Boneco pescando: representa a captação do lead. Ciclo de 6,5 s: ginga, arremessa com o corpo, fisga e puxa o peixe.
(function () {
  const svg = document.getElementById('pesca-svg');
  if (!svg) return;
  const els = {};
  svg.querySelectorAll('[data-pesca]').forEach((el) => { els[el.getAttribute('data-pesca')] = el; });
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia && window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  // No celular o adesivo fica sem desfoque e sem sombra: o filtro é recalculado a cada quadro e pesa
  if (mobile) {
    const filtro = svg.querySelector('#pesca-adesivo');
    if (filtro) {
      filtro.innerHTML =
        '<feMorphology in="SourceAlpha" operator="dilate" radius="22" result="d"></feMorphology>' +
        '<feFlood flood-color="#ffffff" result="w"></feFlood>' +
        '<feComposite in="w" in2="d" operator="in" result="s"></feComposite>' +
        '<feMerge><feMergeNode in="s"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>';
    }
  }

  // Poses-chave (coordenadas articuladas para interpolação suave; spineBend curva a coluna)
  const POSES = {
    // Desleixado, com gingado relaxado
    slouched: {
      head: [330, 312], torsoTop: [262, 362], torsoShoulder: [328, 376], hipFront: [306, 480], hipBack: [214, 492], spineBend: -20,
      fKnee: [368, 586], fFoot: [372, 704], bKnee: [282, 604], bFoot: [248, 720],
      bArmShoulder: [316, 384], bArmElbow: [365, 442], bArmHand: [425, 415],
      fArmShoulder: [256, 388], fArmElbow: [272, 462], fArmHand: [382, 442],
      rodButt: [338, 468], rodGrip: [425, 415], rodCtrl1: [502, 368], rodCtrl2: [582, 326], rodTip: [662, 292],
      lineC1: [662, 365], lineC2: [656, 452], lineEnd: [652, 545], fishScale: 0, fishRot: 0
    },
    // Impulso exagerado: coluna arqueada para trás, peito aberto
    windup: {
      head: [188, 286], torsoTop: [176, 354], torsoShoulder: [246, 344], hipFront: [330, 468], hipBack: [238, 484], spineBend: 28,
      fKnee: [392, 574], fFoot: [382, 704], bKnee: [305, 594], bFoot: [248, 720],
      bArmShoulder: [236, 350], bArmElbow: [278, 328], bArmHand: [265, 248],
      fArmShoulder: [182, 372], fArmElbow: [188, 398], fArmHand: [248, 298],
      rodButt: [232, 345], rodGrip: [265, 248], rodCtrl1: [215, 165], rodCtrl2: [148, 102], rodTip: [75, 65],
      lineC1: [55, 125], lineC2: [62, 195], lineEnd: [88, 255], fishScale: 0, fishRot: 0
    },
    // Arremesso: projeta o corpo e a coluna para frente
    castThrow: {
      head: [376, 286], torsoTop: [298, 342], torsoShoulder: [366, 362], hipFront: [316, 474], hipBack: [224, 486], spineBend: -28,
      fKnee: [396, 572], fFoot: [388, 704], bKnee: [298, 596], bFoot: [248, 720],
      bArmShoulder: [354, 368], bArmElbow: [418, 396], bArmHand: [484, 336],
      fArmShoulder: [292, 370], fArmElbow: [322, 434], fArmHand: [442, 375],
      rodButt: [400, 412], rodGrip: [484, 336], rodCtrl1: [565, 248], rodCtrl2: [642, 198], rodTip: [712, 188],
      lineC1: [730, 270], lineC2: [712, 420], lineEnd: [685, 565], fishScale: 0, fishRot: 0
    },
    // Postura firme e preparada
    ready: {
      head: [282, 266], torsoTop: [232, 334], torsoShoulder: [302, 348], hipFront: [308, 472], hipBack: [216, 484], spineBend: 6,
      fKnee: [384, 570], fFoot: [386, 704], bKnee: [296, 594], bFoot: [248, 720],
      bArmShoulder: [295, 356], bArmElbow: [356, 404], bArmHand: [408, 334],
      fArmShoulder: [224, 360], fArmElbow: [240, 434], fArmHand: [374, 380],
      rodButt: [336, 430], rodGrip: [408, 334], rodCtrl1: [482, 238], rodCtrl2: [575, 168], rodTip: [650, 140],
      lineC1: [625, 255], lineC2: [608, 410], lineEnd: [598, 540], fishScale: 0.85, fishRot: -8
    },
    // Puxando com força (a pose da imagem original)
    pullHard: {
      head: [258, 285], torsoTop: [212, 346], torsoShoulder: [285, 362], hipFront: [304, 472], hipBack: [208, 486], spineBend: 8,
      fKnee: [378, 565], fFoot: [386, 704], bKnee: [304, 608], bFoot: [248, 720],
      bArmShoulder: [285, 370], bArmElbow: [348, 415], bArmHand: [385, 335],
      fArmShoulder: [206, 373], fArmElbow: [218, 446], fArmHand: [355, 385],
      rodButt: [321, 448], rodGrip: [385, 335], rodCtrl1: [425, 255], rodCtrl2: [505, 138], rodTip: [608, 58],
      lineC1: [565, 145], lineC2: [582, 255], lineEnd: [548, 368], fishScale: 1, fishRot: 0
    },
    // Puxada máxima
    pullPeak: {
      head: [242, 290], torsoTop: [198, 350], torsoShoulder: [272, 366], hipFront: [300, 474], hipBack: [202, 488], spineBend: 16,
      fKnee: [378, 568], fFoot: [386, 704], bKnee: [300, 612], bFoot: [248, 720],
      bArmShoulder: [272, 374], bArmElbow: [338, 418], bArmHand: [374, 338],
      fArmShoulder: [194, 377], fArmElbow: [206, 450], fArmHand: [344, 388],
      rodButt: [312, 452], rodGrip: [374, 338], rodCtrl1: [412, 250], rodCtrl2: [498, 148], rodTip: [596, 72],
      lineC1: [552, 152], lineC2: [576, 248], lineEnd: [544, 352], fishScale: 1, fishRot: 6
    }
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function interpolatePose(a, b, rawT) {
    const t = easeInOut(Math.max(0, Math.min(1, rawT)));
    const r = {};
    for (const k in a) {
      r[k] = Array.isArray(a[k]) ? [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)] : lerp(a[k], b[k], t);
    }
    return r;
  }

  // Membro com curva suave na articulação
  function limb(sx, sy, jx, jy, ex, ey, radius) {
    const v1x = jx - sx, v1y = jy - sy, l1 = Math.hypot(v1x, v1y) || 1, r1 = Math.min(radius, l1 * 0.45);
    const v2x = ex - jx, v2y = ey - jy, l2 = Math.hypot(v2x, v2y) || 1, r2 = Math.min(radius, l2 * 0.45);
    const p1x = jx - (v1x / l1) * r1, p1y = jy - (v1y / l1) * r1;
    const p2x = jx + (v2x / l2) * r2, p2y = jy + (v2y / l2) * r2;
    return `M ${sx} ${sy} L ${p1x} ${p1y} Q ${jx} ${jy}, ${p2x} ${p2y} L ${ex} ${ey}`;
  }

  function ring(el, cx, cy, progress, maxRx, maxRy) {
    if (progress <= 0 || progress >= 1) { el.setAttribute('opacity', '0'); return; }
    const eased = 1 - Math.pow(1 - progress, 2.2);
    el.setAttribute('cx', cx);
    el.setAttribute('cy', cy);
    el.setAttribute('rx', 6 + eased * maxRx);
    el.setAttribute('ry', 2.5 + eased * maxRy);
    el.setAttribute('stroke-width', Math.max(1.2, 6.5 * (1 - progress * 0.8)));
    el.setAttribute('opacity', '1');
  }

  function render(p, timeSec, cycleTime) {
    els.head.setAttribute('cx', p.head[0]);
    els.head.setAttribute('cy', p.head[1]);
    els.backArm.setAttribute('d', limb(p.bArmShoulder[0], p.bArmShoulder[1], p.bArmElbow[0], p.bArmElbow[1], p.bArmHand[0], p.bArmHand[1], 22));

    // Vara afunilada
    const dx = p.rodTip[0] - p.rodButt[0], dy = p.rodTip[1] - p.rodButt[1], len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 5.5, ny = (dx / len) * 5.5;
    els.rodMain.setAttribute('d',
      `M ${p.rodButt[0] - nx} ${p.rodButt[1] - ny} C ${p.rodCtrl1[0] - nx * 0.7} ${p.rodCtrl1[1] - ny * 0.7}, ${p.rodCtrl2[0] - nx * 0.3} ${p.rodCtrl2[1] - ny * 0.3}, ${p.rodTip[0]} ${p.rodTip[1]} ` +
      `C ${p.rodCtrl2[0] + nx * 0.3} ${p.rodCtrl2[1] + ny * 0.3}, ${p.rodCtrl1[0] + nx * 0.7} ${p.rodCtrl1[1] + ny * 0.7}, ${p.rodButt[0] + nx} ${p.rodButt[1] + ny} Z`);
    els.rodHandle.setAttribute('x1', p.rodButt[0]);
    els.rodHandle.setAttribute('y1', p.rodButt[1]);
    els.rodHandle.setAttribute('x2', p.rodGrip[0]);
    els.rodHandle.setAttribute('y2', p.rodGrip[1]);

    els.frontLeg.setAttribute('d', limb(p.hipFront[0] - 22, p.hipFront[1] + 16, p.fKnee[0] + 4, p.fKnee[1] - 6, p.fFoot[0], p.fFoot[1], 36));

    // Tronco com a coluna curvando (arqueia para trás e projeta para frente sem esmagar)
    const [tx, ty] = p.torsoTop, [sx, sy] = p.torsoShoulder, [hfx, hfy] = p.hipFront, [hbx, hby] = p.hipBack;
    const bend = p.spineBend || 0;
    const topMidX = (tx + sx) * 0.5, topMidY = (ty + sy) * 0.5;
    const botMidX = (hbx + hfx) * 0.5, botMidY = (hby + hfy) * 0.5;
    const spL = Math.hypot(topMidX - botMidX, topMidY - botMidY) || 1;
    const usx = (topMidX - botMidX) / spL, usy = (topMidY - botMidY) / spL;
    const nfx = -usy, nfy = usx;
    const bsx = tx - usx * 52 - nfx * 14, bsy = ty - usy * 52 - nfy * 14;
    const fmx = (sx + hfx) * 0.5 + nfx * bend, fmy = (sy + hfy) * 0.5 + nfy * bend;
    const bmx = (bsx + hbx) * 0.5 + nfx * bend, bmy = (bsy + hby) * 0.5 + nfy * bend;
    els.torsoBorder.setAttribute('d',
      `M ${tx} ${ty} C ${tx + nfx * 22} ${ty + nfy * 22}, ${sx - nfx * 18} ${sy - nfy * 18}, ${sx} ${sy} ` +
      `Q ${fmx} ${fmy}, ${hfx} ${hfy} ` +
      `C ${hfx + 5} ${hfy + 30}, ${hfx - 10} ${hfy + 54}, ${hfx - 36} ${hfy + 60} ` +
      `C ${hbx + 30} ${hby + 52}, ${hbx + 10} ${hby + 34}, ${hbx} ${hby} ` +
      `Q ${bmx} ${bmy}, ${bsx} ${bsy} ` +
      `C ${bsx + usx * 26} ${bsy + usy * 26}, ${tx - nfx * 16} ${ty - nfy * 16}, ${tx} ${ty} Z`);
    els.backLeg.setAttribute('d', limb(hbx + 44, hby + 19, p.bKnee[0] + 6, p.bKnee[1] - 2, p.bFoot[0], p.bFoot[1], 34));
    els.torsoFill.setAttribute('d',
      `M ${tx} ${ty} C ${tx + nfx * 22} ${ty + nfy * 22}, ${sx - nfx * 18} ${sy - nfy * 18}, ${sx} ${sy} ` +
      `Q ${fmx - 1} ${fmy}, ${hfx - 1} ${hfy} ` +
      `C ${hfx + 3} ${hfy + 23}, ${hfx - 6} ${hfy + 43}, ${hfx - 24} ${hfy + 52} L ${hbx + 32} ${hby + 38} ` +
      `C ${hbx + 12} ${hby + 29}, ${hbx + 4} ${hby + 9}, ${hbx - 2} ${hby - 11} ` +
      `Q ${bmx} ${bmy}, ${bsx} ${bsy} ` +
      `C ${bsx + usx * 26} ${bsy + usy * 26}, ${tx - nfx * 16} ${ty - nfy * 16}, ${tx} ${ty} Z`);

    // Braço da frente
    const armD = limb(p.fArmShoulder[0], p.fArmShoulder[1], p.fArmElbow[0], p.fArmElbow[1], p.fArmHand[0], p.fArmHand[1], 38);
    els.frontArmBorder.setAttribute('d', armD);
    els.frontArm.setAttribute('d', armD);

    // Vara passando na frente do braço de trás
    const ax = p.rodGrip[0] - p.rodButt[0], ay = p.rodGrip[1] - p.rodButt[1], al = Math.hypot(ax, ay) || 1;
    const ux = ax / al, uy = ay / al;
    els.rodOverlapWhite.setAttribute('d', `M ${p.fArmHand[0] + ux * 16} ${p.fArmHand[1] + uy * 16} L ${p.rodGrip[0] + ux * 36} ${p.rodGrip[1] + uy * 36}`);
    els.rodOverlapBlack.setAttribute('d', `M ${p.fArmHand[0] - ux * 12} ${p.fArmHand[1] - uy * 12} L ${p.rodGrip[0] + ux * 42} ${p.rodGrip[1] + uy * 42}`);

    // Mão fechando sobre a vara
    const fx = p.fArmHand[0] - p.fArmElbow[0], fy = p.fArmHand[1] - p.fArmElbow[1], fl = Math.hypot(fx, fy) || 1;
    els.frontHand.setAttribute('d', `M ${p.fArmHand[0] - (fx / fl) * 32} ${p.fArmHand[1] - (fy / fl) * 32} L ${p.fArmHand[0]} ${p.fArmHand[1]}`);

    // Linha de pesca
    const [tipX, tipY] = p.rodTip, [endX, endY] = p.lineEnd;
    const wave = Math.sin(timeSec * 14) * 4 * p.fishScale;
    const m1y = lerp(tipY, endY, 0.35), m2y = lerp(tipY, endY, 0.68);
    els.fishingLine.setAttribute('d', `M ${tipX} ${tipY} Q ${p.lineC1[0]} ${p.lineC1[1]}, ${p.lineC1[0] + wave} ${m1y} T ${p.lineC2[0] - wave} ${m2y} T ${endX} ${endY}`);

    // Peixe (o lead) fisgado
    if (p.fishScale <= 0.02) {
      els.fishGroup.setAttribute('opacity', '0');
    } else {
      els.fishGroup.setAttribute('opacity', '1');
      const wiggle = Math.sin(timeSec * 18) * 4 * p.fishScale;
      els.fishGroup.setAttribute('transform', `translate(${endX}, ${endY}) rotate(${p.fishRot + wiggle}) scale(${p.fishScale})`);
    }

    // Ondas na água quando a linha cai
    if (cycleTime >= 2.15 && cycleTime <= 3.55) {
      const e = cycleTime - 2.15;
      const q1 = Math.min(1, Math.max(0, e / 1.1)), q2 = Math.min(1, Math.max(0, (e - 0.18) / 1.1)), q3 = Math.min(1, Math.max(0, (e - 0.36) / 1.1));
      els.waterEffects.setAttribute('opacity', '1');
      ring(els.waterRing1, 682 + q1 * 18, 568, q1, 68, 22);
      ring(els.waterRing2, 682 + q2 * 14, 568, q2, 50, 16);
      ring(els.waterRing3, 682 + q3 * 10, 568, q3, 34, 11);
    } else {
      els.waterEffects.setAttribute('opacity', '0');
    }
  }

  const CYCLE = 6.5;
  function poseAt(t) {
    // Gingado suave antes de preparar o bote
    if (t < 1.2) return interpolatePose(POSES.slouched, POSES.ready, ((Math.sin((t / 1.2) * Math.PI * 2) + 1) * 0.5) * 0.14);
    // Leva a coluna para trás ganhando impulso
    if (t < 1.95) return interpolatePose(POSES.slouched, POSES.windup, (t - 1.2) / 0.75);
    // Chicoteia o corpo para frente jogando a vara
    if (t < 2.28) return interpolatePose(POSES.windup, POSES.castThrow, (t - 1.95) / 0.33);
    // Assenta na postura firme logo após o arremesso
    if (t < 2.95) return interpolatePose(POSES.castThrow, POSES.ready, (t - 2.28) / 0.67);
    // Firme e alerta, sentindo a fisgada
    if (t < 3.65) return interpolatePose(POSES.ready, POSES.pullHard, Math.sin(((t - 2.95) / 0.7) * Math.PI) * 0.15);
    // Puxa com força inclinando o corpo para trás
    if (t < 4.25) return interpolatePose(POSES.ready, POSES.pullHard, (t - 3.65) / 0.6);
    // Trancos de força puxando o peixe
    if (t < 5.9) return interpolatePose(POSES.pullHard, POSES.pullPeak, (1 - Math.cos(((t - 4.25) / 1.65) * Math.PI * 4)) / 2);
    // Volta à postura desleixada para reiniciar
    return interpolatePose(POSES.pullHard, POSES.slouched, (t - 5.9) / 0.6);
  }

  // Quem prefere menos movimento vê a pose da puxada, parada
  if (reduce) { render(POSES.pullHard, 0, 4.5); return; }

  // Só anima quando a seção está na tela
  let visible = false, raf = 0, ultimo = 0;
  const intervalo = mobile ? 1000 / 30 : 0;
  function loop(now) {
    if (!visible) { raf = 0; return; }
    if (!intervalo || now - ultimo >= intervalo - 2) {
      ultimo = now;
      render(poseAt((now / 1000) % CYCLE), now / 1000, (now / 1000) % CYCLE);
    }
    raf = requestAnimationFrame(loop);
  }
  render(POSES.pullHard, 0, 4.5);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '0px' }).observe(svg);
})();
