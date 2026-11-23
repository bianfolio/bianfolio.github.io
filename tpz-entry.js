(() => {
  const root = document.getElementById('detail-y3s1');
  if (!root) return;
  const deerBack=document.querySelector('button[data-term="Y3S1"] .icon-back');
  if (deerBack) deerBack.src='assets/lad3001/deer.png';
  let running = false;
  let overlay;
  const effects = [];
  function animate(el, frames, duration, easing = 'ease', delay = 0) {
    const effect = el.animate(frames,{duration,delay,easing,fill:'forwards'});
    effects.push(effect);
    return effect.finished;
  }
  function reset() {
    running = false;
    for (const effect of effects.splice(0)) effect.cancel();
    overlay?.remove();
  }
  window.addEventListener('pageshow',reset);
  root.addEventListener('click',async event => {
    const link=event.target.closest('.tpz-link');
    if (!link || event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (running) return;
    running=true;
    const frame=link.querySelector('.tpz-frame');
    const question=frame.querySelector('.tpz-speech');
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const ns='http://www.w3.org/2000/svg';
    overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;overflow:hidden;pointer-events:auto;';
    const announcement=document.createElement('span');
    announcement.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
    announcement.setAttribute('role','status');
    overlay.append(announcement);
    document.body.append(overlay);
    try {
      announcement.textContent='So how close can we get?';
      await animate(question,[{opacity:0},{opacity:1}],reduced?0:320);
      await new Promise(resolve=>setTimeout(resolve,1550));
      if (!running) return;
      if (reduced) {
        await animate(overlay,[{background:'transparent'},{background:'white'}],240);
      } else {
        const scene=frame.querySelector('.tpz-scene');
        const screen=scene.getScreenCTM();
        const focal=new DOMPoint(Number(scene.dataset.focalX),Number(scene.dataset.focalY)).matrixTransform(screen);
        const stage=document.createElementNS(ns,'svg');
        stage.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible;';
        stage.style.transformOrigin=focal.x+'px '+focal.y+'px';
        const art=scene.cloneNode(true);
        art.setAttribute('transform',`matrix(${screen.a} ${screen.b} ${screen.c} ${screen.d} ${screen.e} ${screen.f})`);
        stage.append(art);
        overlay.append(stage);
        await Promise.all([
          animate(frame,[{opacity:1},{opacity:0}],0),
          animate(overlay,[{background:'transparent'},{background:'#faf7f0'},{background:'white'}],1460),
          animate(stage,[{transform:'none'},{transform:`translate(${innerWidth/2-focal.x}px,${innerHeight/2-focal.y}px) scale(5.8)`}],1460,'cubic-bezier(.55,0,.76,.35)'),
          animate(stage,[{opacity:1},{opacity:0}],480,'ease',980)
        ]);
      }
    } finally {
      if (running) location.assign(link.href.baseVal || link.getAttribute('href'));
    }
  });
})();
