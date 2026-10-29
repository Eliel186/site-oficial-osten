// Boneco pescando: representa a captação do lead. Ciclo de 6,5 s: espera, arremessa, fisga e puxa o peixe.
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

  // Poses-chave (coordenadas articuladas para interpolação suave)
  const POSES = {
    // Relaxado, segurando a vara
    slouched: {
      head: [312, 302], torsoTop: [248, 355], torsoShoulder: [316, 370], hipFront: [310, 478], hipBack: [218, 490],
      fKnee: [365, 582], fFoot: [372, 704], bKnee: [288, 600], bFoot: [248, 720],
      bArmShoulder: [305, 378], bArmElbow: [358, 434], bArmHand: [418, 405],
      fArmShoulder: [245, 382], fArmElbow: [262, 456], fArmHand: [375, 432],
      rodButt: [330, 460], rodGrip: [418, 405], rodCtrl1: [495, 358], rodCtrl2: [575, 315], rodTip: [655, 280],
      lineC1: [655, 355], lineC2: [650, 445], lineEnd: [648, 540], fishScale: 0, fishRot: 0
    },
    // Impulso para trás
    windup: {
      head: [282, 292], torsoTop: [228, 348], torsoShoulder: [298, 362], hipFront: [306, 476], hipBack: [214, 488],
      fKnee: [368, 578], fFoot: [376, 704], bKnee: [292, 602], bFoot: [248, 720],
      bArmShoulder: [288, 368], bArmElbow: [342, 378], bArmHand: [345, 305],
      fArmShoulder: [222, 372], fArmElbow: [235, 422], fArmHand: [322, 352],
      rodButt: [298, 400], rodGrip: [345, 305], rodCtrl1: [305, 220], rodCtrl2: [245, 140], rodTip: [175, 75],
      lineC1: [140, 125], lineC2: [125, 185], lineEnd: [135, 245], fishScale: 0, fishRot: 0
    },
    // Arremesso
    castThrow: {
      head: [322, 292], torsoTop: [255, 348], torsoShoulder: [324, 365], hipFront: [312, 476], hipBack: [220, 488],
      fKnee: [374, 576], fFoot: [380, 704], bKnee: [292, 600], bFoot: [248, 720],
      bArmShoulder: [312, 372], bArmElbow: [372, 405], bArmHand: [435, 345],
      fArmShoulder: [248, 376], fArmElbow: [268, 438], fArmHand: [396, 382],
      rodButt: [358, 418], rodGrip: [435, 345], rodCtrl1: [520, 265], rodCtrl2: [615, 215], rodTip: [690, 195],
      lineC1: [715, 275], lineC2: [705, 420], lineEnd: [685, 565], fishScale: 0, fishRot: 0
    },
    // Sente a fisgada
    ready: {
      head: [288, 282], torsoTop: [232, 345], torsoShoulder: [302, 360], hipFront: [306, 474], hipBack: [215, 486],
      fKnee: [378, 576], fFoot: [384, 704], bKnee: [292, 595], bFoot: [248, 720],
      bArmShoulder: [295, 368], bArmElbow: [358, 412], bArmHand: [405, 342],
      fArmShoulder: [222, 372], fArmElbow: [235, 442], fArmHand: [372, 388],
      rodButt: [335, 438], rodGrip: [405, 342], rodCtrl1: [478, 245], rodCtrl2: [572, 175], rodTip: [648, 145],
      lineC1: [625, 255], lineC2: [608, 410], lineEnd: [598, 540], fishScale: 0.85, fishRot: -8
    },
    // Puxando com força
    pullHard: {
      head: [258, 285], torsoTop: [212, 346], torsoShoulder: [285, 362], hipFront: [304, 472], hipBack: [208, 486],
      fKnee: [378, 565], fFoot: [386, 704], bKnee: [304, 608], bFoot: [248, 720],
      bArmShoulder: [285, 370], bArmElbow: [348, 415], bArmHand: [385, 335],
      fArmShoulder: [206, 373], fArmElbow: [218, 446], fArmHand: [355, 385],
      rodButt: [321, 448], rodGrip: [385, 335], rodCtrl1: [425, 255], rodCtrl2: [505, 138], rodTip: [608, 58],
      lineC1: [565, 145], lineC2: [582, 255], lineEnd: [548, 368], fishScale: 1, fishRot: 0
    },
    // Puxada máxima
    pullPeak: {
      head: [242, 290], torsoTop: [198, 350], torsoShoulder: [272, 366], hipFront: [300, 474], hipBack: [202, 488],
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

    els.frontLeg.setAttribute('d', limb(p.hipFront[0] - 22, p.hipFront[1] + 16, p.fKnee[0] + 4, p.fKnee[1] - 6, p.fFoot[0], p.fFoot[1], 32));

    // Tronco
    const [tx, ty] = p.torsoTop, [sx, sy] = p.torsoShoulder, [hfx, hfy] = p.hipFront, [hbx, hby] = p.hipBack;
    els.torsoBorder.setAttribute('d',
      `M ${tx} ${ty} C ${tx + 23} ${ty - 4}, ${sx - 20} ${sy - 17}, ${sx} ${sy} L ${hfx} ${hfy} ` +
      `C ${hfx + 5} ${hfy + 30}, ${hfx - 10} ${hfy + 54}, ${hfx - 36} ${hfy + 60} C ${hbx + 30} ${hby + 52}, ${hbx + 10} ${hby + 34}, ${hbx} ${hby} ` +
      `L ${tx - 22} ${ty + 54} C ${tx - 27} ${ty + 24}, ${tx - 20} ${ty + 4}, ${tx} ${ty} Z`);
    els.backLeg.setAttribute('d', limb(hbx + 44, hby + 19, p.bKnee[0] + 6, p.bKnee[1] - 2, p.bFoot[0], p.bFoot[1], 34));
    els.torsoFill.setAttribute('d',
      `M ${tx} ${ty} C ${tx + 23} ${ty - 4}, ${sx - 20} ${sy - 17}, ${sx} ${sy} L ${hfx - 1} ${hfy} ` +
      `C ${hfx + 3} ${hfy + 23}, ${hfx - 6} ${hfy + 43}, ${hfx - 24} ${hfy + 52} L ${hbx + 32} ${hby + 38} ` +
      `C ${hbx + 12} ${hby + 29}, ${hbx + 4} ${hby + 9}, ${hbx - 2} ${hby - 11} L ${tx - 22} ${ty + 54} ` +
      `C ${tx - 27} ${ty + 24}, ${tx - 20} ${ty + 4}, ${tx} ${ty} Z`);

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
    if (t < 1.3) return interpolatePose(POSES.slouched, POSES.castThrow, (Math.sin((t / 1.3) * Math.PI * 2) + 1) * 0.12 * 0.15);
    if (t < 1.9) return interpolatePose(POSES.slouched, POSES.windup, (t - 1.3) / 0.6);
    if (t < 2.3) return interpolatePose(POSES.windup, POSES.castThrow, (t - 1.9) / 0.4);
    if (t < 3.1) return interpolatePose(POSES.castThrow, POSES.slouched, ((t - 2.3) / 0.8) * 0.35);
    if (t < 3.7) return interpolatePose(interpolatePose(POSES.castThrow, POSES.slouched, 0.35), POSES.ready, (t - 3.1) / 0.6);
    if (t < 4.3) return interpolatePose(POSES.ready, POSES.pullHard, (t - 3.7) / 0.6);
    if (t < 5.9) return interpolatePose(POSES.pullHard, POSES.pullPeak, (1 - Math.cos(((t - 4.3) / 1.6) * Math.PI * 4)) / 2);
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
