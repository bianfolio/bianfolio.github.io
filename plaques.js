// Desktop plaques rise on approach. The homepage lotus follows the full scroll distance.
(() => {
  const footer = document.querySelector('.board-footer');
  if (!footer) return;
  const plaques = footer.querySelectorAll('.contact-plaque');
  const mobile = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const lotus = document.querySelector('.back-to-top');
  let raised = null;
  let pending = false;

  function selectPlaque(next) {
    if (raised === next) return;
    if (raised) raised.classList.remove('is-raised');
    raised = next;
    if (raised) raised.classList.add('is-raised');
  }

  // Mouse and keyboard keep direct links. Touch lifts first, then follows the link.
  let pointerType = '';
  document.addEventListener('pointerdown', event => {
    pointerType = event.pointerType;
    if (!footer.contains(event.target)) selectPlaque(null);
  }, { passive: true });
  footer.addEventListener('click', event => {
    const plaque = event.target.closest('.contact-plaque');
    if (mobile.matches || !plaque || event.detail === 0 || (event.pointerType || pointerType) !== 'touch') return;
    if (raised !== plaque) {
      event.preventDefault();
      selectPlaque(plaque);
    } else if (!event.target.closest('a')) {
      plaque.querySelector('a').click();
    }
  });
  const clamp = value => Math.min(1, Math.max(0, value));

  function render() {
    pending = false;
    const rect = footer.getBoundingClientRect();
    if (!rect.height) return;
    if (lotus) {
      const travel = document.documentElement.scrollHeight - innerHeight;
      const t = travel > 0 ? clamp(scrollY / travel) : 0;
      const bloom = t * t * (3 - 2 * t);
      lotus.style.setProperty('--bloom', bloom.toFixed(4));
      lotus.style.setProperty('--petal-solid', (135 * bloom - 35) + '%');
      lotus.style.setProperty('--petal-edge', (135 * bloom) + '%');
    }
    if (mobile.matches) return;
    const progress = clamp((innerHeight - rect.top) / rect.height);
    if (progress === 0) selectPlaque(null);
    plaques.forEach((plaque, i) => {
      const delay = i * .055;
      const t = reduced.matches ? 1 : clamp((progress - delay) / (1 - delay));
      const eased = t * t * (3 - 2 * t);
      plaque.style.setProperty('--rise', (78 * (1 - eased)).toFixed(3) + '%');
    });
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(render);
    }
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  mobile.addEventListener('change', () => {
    selectPlaque(null);
    schedule();
  });
  reduced.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(footer);
  render();
})();
