(() => {
  const works = document.querySelector('.work-index');
  if (!works) return;
  works.dataset.motion = 'unroll';
  const motionParam = new URLSearchParams(location.search).get('motion');
  const motionKey = 'bian-portfolio.project-motion';
  // A tap starts the project animation even on a first visit to this site.
  let projectMotion = motionParam === 'system' ? 'system' : 'full';
  try {
    if (motionParam === 'full' || motionParam === 'system') {
      localStorage.setItem(motionKey, motionParam);
    } else if (localStorage.getItem(motionKey) === 'system') {
      projectMotion = 'system';
    }
  } catch {
    // The current visit also works when browser storage is unavailable.
  }
  works.dataset.projectMotion = projectMotion;
  const board = works.querySelector('.board-works');
  const desktopView = board.getAttribute('viewBox');
  const mobile = matchMedia('(max-width: 760px)');
  function placeFrames() {
    board.setAttribute('viewBox', mobile.matches ? '0 0 390 968.16' : desktopView);
  }
  mobile.addEventListener('change', placeFrames);
  placeFrames();
  for (const button of works.querySelectorAll('.project-icon')) {
    const project = document.getElementById(button.getAttribute('aria-controls'));
    const mobileFrames = project.querySelector('.mobile-frames');
    const lines = [...mobileFrames.querySelectorAll('.line-space')]
      .sort((a, b) => a.y.baseVal.value - b.y.baseVal.value);
    const firstLineDelay = mobileFrames.querySelector('.image-space') ? 100 : 0;
    lines.forEach((line, index) => {
      line.style.setProperty('--reveal-delay', (firstLineDelay + index * 55) + 'ms');
    });
    project.setAttribute('aria-hidden', 'true');
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') === 'false';
      button.setAttribute('aria-expanded', String(opening));
      project.setAttribute('aria-hidden', String(!opening));
    });
  }
})();
