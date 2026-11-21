// Fit the three adjoining parts of the Illustrator contour around responsive text.
(() => {
  const folio = document.querySelector('.folio');
  const ribbon = folio.querySelector('.silk');
  const portrait = folio.querySelector('.silk-portrait');
  const projects = folio.querySelector('.project-route');
  const mobile = matchMedia('(max-width: 760px)');

  const desktopRibbon = folio.querySelector('.board-silk');
  const mobileWash = folio.querySelector('.silk-wash');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const firstIcon = projects.querySelector('.project-icon');
  const washArt = mobileWash.firstElementChild;
  const timeline = typeof ScrollTimeline === 'function'
    ? new ScrollTimeline({ source: document.scrollingElement, axis: 'block' }) : null;
  let animations = [];
  let viewport, travel, pageTop, feather, entryDistance, exitDistance;
  let frame = 0;

  function colourFront(offset) {
    const entry = Math.min(1, offset / entryDistance);
    const exit = Math.max(0, 1 - (travel - offset) / exitDistance);
    return offset + viewport * (.58 * entry + .42 * exit) + feather * (exit + entry - 1);
  }

  function translate(y) { return 'translate3d(0,' + y + 'px,0)'; }

  function paintScroll() {
    frame = 0;
    const offset = Math.max(0, Math.min(travel, window.scrollY - pageTop));
    const front = travel <= 2 ? viewport + travel + feather : colourFront(offset);
    if (mobile.matches) {
      // Move the soft edge but keep its printed artwork registered to the page.
      mobileWash.style.transform = translate(front - feather);
      washArt.style.transform = translate(feather - front);
    } else if (!reducedMotion.matches) {
      desktopRibbon.style.setProperty('--colour-start', (front - feather) + 'px');
      desktopRibbon.style.setProperty('--colour-front', front + 'px');
      desktopRibbon.style.setProperty('--colour-end', (front + feather) + 'px');
    }
  }

  function queuePaint() {
    if (!animations.length && !frame) frame = requestAnimationFrame(paintScroll);
  }

  function bindScroll() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    if (!mobile.matches || !timeline || travel <= 2) { queuePaint(); return; }
    // The reveal is piecewise linear, so four frames describe both directions.
    const stops = [...new Set([0, entryDistance, travel - exitDistance, travel])];
    const options = { timeline, duration: 'auto', fill: 'both' };
    try {
      for (const [layer, sign] of [[mobileWash, 1], [washArt, -1]]) {
        const frames = stops.map(offset => ({
          offset: offset / travel, transform: translate(sign * (colourFront(offset) - feather))
        }));
        const animation = layer.animate(frames, options);
        animations.push(animation);
        if (animation.timeline !== timeline) break;
      }
      if (animations.length === 2 && animations[1].timeline === timeline) return;
    } catch {
      // Older WebKit versions can expose only part of the scroll timeline API.
    }
    animations.forEach(animation => animation.cancel());
    animations = [];
    queuePaint();
  }

  function fitMobileContour() {
    if (!mobile.matches) return;
    const page = folio.getBoundingClientRect();
    const photo = portrait.getBoundingClientRect();
    const section = projects.parentElement;
    // Register the project area to the drawn board, allowing extra room for wrapped text.
    const padding = Math.max(16, page.width * 1494 / 390 - (section.getBoundingClientRect().top - page.top));
    section.style.setProperty('--route-padding', padding + 'px');
    const stops = [photo.top - page.top - 1.5, photo.bottom - page.top,
                   projects.getBoundingClientRect().top - page.top, page.height];
    ribbon.querySelectorAll('#mobile-panels > svg').forEach((part, index) => {
      part.setAttribute('y', stops[index]);
      part.setAttribute('width', page.width);
      const height = stops[index + 1] - stops[index];
      part.setAttribute('height', height);
      const wash = washArt.children[index];
      wash.style.top = stops[index] + 'px';
      wash.style.height = height + 'px';
    });
  }

  function fitRibbon() {
    fitMobileContour();
    const page = folio.getBoundingClientRect();
    const icon = firstIcon.getBoundingClientRect();
    viewport = document.documentElement.clientHeight;
    pageTop = page.top + window.scrollY;
    travel = page.height - viewport;
    feather = Math.min(viewport * .045, 38);
    const ramp = Math.min(viewport * .7, travel / 2);
    const firstStop = Math.max(1, Math.min(travel - 1, icon.top - page.top + icon.height / 2 - viewport * .58));
    entryDistance = Math.min(ramp, firstStop);
    exitDistance = Math.min(ramp, travel - firstStop);
    mobileWash.style.setProperty('--wash-mid', feather + 'px');
    bindScroll();
  }

  const observer = new ResizeObserver(fitRibbon);
  for (const region of [folio, portrait, projects, folio.querySelector('.experience')]) {
    observer.observe(region);
  }
  mobile.addEventListener('change', fitRibbon);
  window.addEventListener('scroll', queuePaint, { passive: true });
  window.addEventListener('resize', fitRibbon);
  window.addEventListener('pageshow', queuePaint);
  reducedMotion.addEventListener('change', queuePaint);
  document.fonts.ready.then(fitRibbon);
  fitRibbon();
})();
