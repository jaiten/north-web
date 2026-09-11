// North: small, local interactions. The extension preview does not change browser settings.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 761px) and (min-height: 740px)');
  const nav = document.getElementById('nav');
  const links = document.getElementById('nav-links');
  const menu = document.getElementById('nav-toggle');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false); menu.focus();
    }
  });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) setMenu(false); });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  let observer;
  function configureReveals() {
    observer?.disconnect();
    const elements = [...document.querySelectorAll('[data-reveal]')];
    elements.forEach(el => el.classList.remove('reveal-ready'));
    if (motion.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -35px 0px' });
    elements.forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight && !el.classList.contains('in')) {
        el.classList.add('reveal-ready'); observer.observe(el);
      }
    });
  }

  const previews = {
    video: { eyebrow: 'Less of the endless', title: 'A quieter feed.', description: 'Keep the videos you came for.\nLeave the infinite scroll behind.', rows: [
      ['Short-form video', 'Shorts, Reels & Spotlight', true], ['TikTok', 'The whole site, a little further away', true], ['YouTube cleanup', 'Fewer recommendations and detours', true]
    ] },
    messages: { eyebrow: 'Keep the connection', title: 'People, without the feed.', description: 'Your inbox stays open.\nThe rabbit holes don’t.', rows: [
      ['Instagram', 'Messages only', true], ['LinkedIn', 'Messages only', true], ['Facebook & X', 'Messages only', false]
    ] },
    boundaries: { eyebrow: 'Your day, your boundaries', title: 'Room for what matters.', description: 'A few boundaries you choose.\nA little help keeping them.', rows: [
      ['Work hours', 'Monday–Friday · 9 am–5 pm', true], ['Daily site limit', '20 minutes, then a little space', true], ['Focus session', '50 minutes with your blocklist on', false]
    ] }
  };
  const featureTabs = [...document.querySelectorAll('[data-feature]')];
  const panel = document.getElementById('product-panel');
  const settings = document.getElementById('demo-settings');
  const feedback = document.getElementById('demo-feedback');
  function selectFeature(key) {
    const preview = previews[key];
    featureTabs.forEach(tab => {
      const selected = tab.dataset.feature === key;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${key}`);
    document.getElementById('demo-eyebrow').textContent = preview.eyebrow;
    document.getElementById('demo-title').textContent = preview.title;
    document.getElementById('demo-description').innerText = preview.description;
    settings.replaceChildren();
    preview.rows.forEach((row, index) => {
      const item = document.createElement('div'); item.className = 'demo-setting';
      const copy = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = row[0];
      const note = document.createElement('small'); note.textContent = row[1];
      copy.append(title, note);
      const toggle = document.createElement('button'); toggle.className = 'switch';
      toggle.type = 'button'; toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-label', `${row[0]} (preview)`);
      toggle.setAttribute('aria-checked', String(row[2]));
      toggle.addEventListener('click', () => {
        preview.rows[index][2] = !preview.rows[index][2];
        toggle.setAttribute('aria-checked', String(preview.rows[index][2]));
        feedback.textContent = `${row[0]} ${preview.rows[index][2] ? 'on' : 'off'} in this preview. Your browser settings haven’t changed.`;
      });
      item.append(copy, toggle); settings.append(item);
    });
    feedback.textContent = 'Try a switch. This is just a preview.';
  }
  featureTabs.forEach(tab => tab.addEventListener('click', () => selectFeature(tab.dataset.feature)));
  function tabKeys(tabs, select, orientation) {
    tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === (orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % tabs.length;
      if (event.key === (orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft')) next = (index - 1 + tabs.length) % tabs.length;
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus(); select(tabs[next]);
    }));
  }
  tabKeys(featureTabs, tab => selectFeature(tab.dataset.feature), 'vertical');
  selectFeature('video');

  const pause = document.getElementById('unlock');
  const pauseTabs = [...document.querySelectorAll('[data-pause]')];
  const pausePanel = document.getElementById('pause-panel');
  const pauseSteps = [
    ['NOTHING TO DO BUT', 'Breathe.', 'A moment before moving on.', 'A wait you choose, from 10 seconds to 2 minutes.\nLeave the page, and the timer starts again.'],
    ['A NOTE TO YOUR FUTURE SELF', 'Reflect.', 'Twenty words. In your own words.', 'Write at least 20 words about why you need this site.\nYour reasons stay in your browser, for you to revisit.'],
    ['YOUR TIME IS STILL YOURS', 'Choose.', 'Go on with intention. Or go back.', 'Continue to the site, or return to what matters.\nShort-form feeds stay blocked.']
  ];
  let activeStep = -1;
  let lastScrollStep = -1;
  let pinned = false;
  function selectPause(index) {
    if (index === activeStep) return;
    activeStep = index;
    pauseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1;
    });
    pausePanel.setAttribute('aria-labelledby', `pause-tab-${index}`);
    ['ring-overline', 'ring-word', 'ring-bottom', 'pause-description'].forEach((id, i) => {
      document.getElementById(id).innerText = pauseSteps[index][i];
    });
    if (!pinned) pause.style.setProperty('--pause-progress', (index + 1) / 3);
  }
  function navigatePause(index) {
    if (pinned) {
      const top = pause.getBoundingClientRect().top + scrollY - 88;
      const travel = pause.offsetHeight - innerHeight + 88;
      // Keep the pinned illustration in place while moving to the chosen chapter.
      scrollTo({ top: top + travel * ((index + .15) / 3), behavior: 'instant' });
      lastScrollStep = index;
    }
    selectPause(index);
  }
  pauseTabs.forEach(tab => tab.addEventListener('click', () => navigatePause(Number(tab.dataset.pause))));
  tabKeys(pauseTabs, tab => navigatePause(Number(tab.dataset.pause)), 'horizontal');
  function configureMotion() {
    pinned = !motion.matches && desktop.matches;
    document.documentElement.classList.toggle('scroll-enabled', pinned);
    lastScrollStep = -1;
    configureReveals();
    frame();
  }
  function frame() {
    nav.classList.toggle('scrolled', scrollY > 8);
    if (!pinned) return;
    const rect = pause.getBoundingClientRect();
    if (rect.top > innerHeight || rect.bottom < 0) return;
    const progress = Math.max(0, Math.min(1, (88 - rect.top) / (pause.offsetHeight - innerHeight + 88)));
    pause.style.setProperty('--pause-progress', String(.08 + progress * .92));
    const step = Math.min(2, Math.floor(progress * 3));
    if (step !== lastScrollStep) { lastScrollStep = step; selectPause(step); }
  }
  let queued = false;
  function queueFrame() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; frame(); });
  }
  addEventListener('scroll', queueFrame, { passive: true });
  addEventListener('resize', queueFrame);
  motion.addEventListener('change', configureMotion);
  desktop.addEventListener('change', configureMotion);
  selectPause(0);
  configureMotion();
})();
