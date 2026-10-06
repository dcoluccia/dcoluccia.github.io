/* Progressive enhancement: content and links remain available without JS. */
document.documentElement.classList.add('js');

const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
function closeMenu() {
  menu?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});

// Embedded maps hand wheel motion back to the page. Standalone maps still zoom.
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'embedded-map-wheel') return;
  const frames = [...document.querySelectorAll('.data-map iframe')];
  if (!frames.some(frame => frame.contentWindow === event.source)) return;
  const distance = Number(event.data.deltaY);
  if (Number.isFinite(distance)) window.scrollBy(0, Math.max(-500, Math.min(500, distance)));
});

// Highlight sections as their headings enter the readable part of the viewport.
const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
if (sectionLinks.length) {
  const sections = sectionLinks.map(link => document.getElementById(link.dataset.sectionLink));
  const isResearch = document.body.classList.contains('page-research');
  let scheduled = false;
  function updateSection() {
    scheduled = false;
    let active = sections[0];
    const remainingScroll = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    const activationLine = isResearch || window.scrollY < 100 ? 150 : Math.max(150, window.innerHeight - remainingScroll);
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= activationLine) active = section;
    }
    if (isResearch && remainingScroll <= 1) active = sections[sections.length - 1];
    sectionLinks.forEach(link => {
      if (link.dataset.sectionLink === active.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateSection); }
  }, { passive: true });
  window.addEventListener('resize', updateSection);
  window.addEventListener('hashchange', updateSection);
  updateSection();
}

document.querySelectorAll('.copy-citation').forEach(button => {
  button.addEventListener('click', async () => {
    const block = button.closest('.citation-body');
    const text = block.querySelector('code').textContent;
    const status = block.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('code'));
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Select and copy the citation above.';
    }
  });
});

// Keep research abstracts and dataset descriptions compact on mobile.
document.querySelectorAll('.page-research .detail-panel, .page-data .detail-panel').forEach(panel => {
  const body = panel.querySelector('.detail-body');
  const isResearch = panel.closest('.page-research') !== null;
  if (!body?.textContent.trim() || (isResearch && !body.querySelector('h4.eyebrow'))) return;

  const label = isResearch ? 'Abstract' : 'Description';
  body.id = `${panel.id}-${label.toLowerCase()}`;
  body.classList.add('is-collapsed');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mobile-detail-toggle eyebrow';
  button.setAttribute('aria-controls', body.id);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', `Expand ${label.toLowerCase()}`);
  button.innerHTML = `<span>${label}</span><span aria-hidden="true">+</span>`;
  body.before(button);

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${label.toLowerCase()}`);
    body.classList.toggle('is-collapsed', !expanded);
    button.lastElementChild.textContent = expanded ? '×' : '+';
  });
});

const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  const footer = document.querySelector('.site-footer');
  const leftColumn = document.querySelector('.library-index, .split-page > .page-heading');
  let updatePending = false;
  function updateBackToTop() {
    updatePending = false;
    backToTop.classList.toggle('is-visible', window.scrollY > 320);
    const footerOverlap = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
    backToTop.style.setProperty('--footer-overlap', `${Math.round(footerOverlap)}px`);
    if (leftColumn) {
      backToTop.style.setProperty('--left-column-start', `${Math.round(leftColumn.getBoundingClientRect().left)}px`);
    }
  }
  function scheduleBackToTopUpdate() {
    if (!updatePending) {
      updatePending = true;
      requestAnimationFrame(updateBackToTop);
    }
  }
  window.addEventListener('scroll', scheduleBackToTopUpdate, { passive: true });
  window.addEventListener('resize', scheduleBackToTopUpdate);
  backToTop.addEventListener('click', () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
  });
  updateBackToTop();
}

// A quieter, local version of the particle field from the original homepage.
const particleCanvas = document.querySelector('.header-particles');
const particleContext = particleCanvas?.getContext('2d');
if (particleContext) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let particles = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let previousTime = 0;
  let pointer = null;

  function drawParticles() {
    particleContext.clearRect(0, 0, width, height);
    const reach = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= reach) continue;
        particleContext.strokeStyle = `rgba(23,24,21,${0.2 * (1 - distance / reach)})`;
        particleContext.lineWidth = 0.8;
        particleContext.beginPath();
        particleContext.moveTo(a.x, a.y);
        particleContext.lineTo(b.x, b.y);
        particleContext.stroke();
      }
    }
    if (pointer && !reducedMotion.matches) {
      for (const particle of particles) {
        const distance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
        if (distance >= 115) continue;
        particleContext.strokeStyle = `rgba(23,24,21,${0.28 * (1 - distance / 115)})`;
        particleContext.lineWidth = 0.8;
        particleContext.beginPath();
        particleContext.moveTo(particle.x, particle.y);
        particleContext.lineTo(pointer.x, pointer.y);
        particleContext.stroke();
      }
    }
    particleContext.fillStyle = 'rgba(23,24,21,0.3)';
    for (const particle of particles) {
      particleContext.beginPath();
      particleContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      particleContext.fill();
    }
  }

  function animateParticles(time) {
    frame = 0;
    const elapsed = previousTime ? Math.min((time - previousTime) / 16.7, 2) : 1;
    previousTime = time;
    for (const particle of particles) {
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;
    }
    drawParticles();
    if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animateParticles);
  }

  function startParticles() {
    if (!frame && width && !document.hidden && !reducedMotion.matches) {
      previousTime = 0;
      frame = requestAnimationFrame(animateParticles);
    }
  }

  function resizeParticles() {
    const bounds = particleCanvas.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    if (nextWidth === width && nextHeight === height) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    width = nextWidth;
    height = nextHeight;
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    particleCanvas.width = Math.round(width * scale);
    particleCanvas.height = Math.round(height * scale);
    particleContext.setTransform(scale, 0, 0, scale, 0, 0);
    particles = Array.from({ length: Math.round(width / 18) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: 0.9 + Math.random() * 0.8,
    }));
    drawParticles();
    startParticles();
  }

  function addParticles(x, y) {
    if (!width || !height) return;
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: Math.max(0, Math.min(width, x + (Math.random() - 0.5) * 24)),
        y: Math.max(0, Math.min(height, y + (Math.random() - 0.5) * 24)),
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        radius: 1.1 + Math.random() * 0.9,
      });
    }
    if (particles.length > 38) particles.splice(0, particles.length - 38);
    drawParticles();
    startParticles();
  }

  particleCanvas.addEventListener('pointermove', event => {
    if (reducedMotion.matches) return;
    const bounds = particleCanvas.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (!frame) drawParticles();
  });
  particleCanvas.addEventListener('pointerleave', () => {
    pointer = null;
    if (!frame) drawParticles();
  });
  particleCanvas.addEventListener('pointerdown', event => {
    const bounds = particleCanvas.getBoundingClientRect();
    addParticles(event.clientX - bounds.left, event.clientY - bounds.top);
  });
  particleCanvas.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    addParticles(width * 0.75, height * 0.5);
  });

  new ResizeObserver(resizeParticles).observe(particleCanvas);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      drawParticles();
    } else startParticles();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else startParticles();
  });
  resizeParticles();
}
