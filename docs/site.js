const repo = 'https://github.com/VITASID57/bluntcore-intimacy-lab';
const site = document.querySelector('#site');
const inPreview = window.parent !== window && new URLSearchParams(location.search).has('preview');

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function linkUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.href);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function picture(value, className) {
  const url = /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value) ? value : linkUrl(value);
  if (!url) return null;
  const image = node('img', className);
  image.src = url;
  image.alt = '';
  if (!className) image.loading = 'lazy';
  return image;
}

function renderCard(item) {
  const href = linkUrl(item.url);
  const card = node(href ? 'a' : 'article', 'card');
  if (href) {
    card.href = href;
    if (inPreview) {
      card.target = '_blank';
      card.rel = 'noopener';
    }
  }
  const image = picture(item.image);
  if (image) card.append(image);
  const body = node('div', 'card-body');
  const title = node('h3', '', item.title || '未命名条目');
  if (href) {
    const arrow = node('span', 'arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    title.append(arrow);
  }
  body.append(title);
  if (item.description) body.append(node('p', '', item.description));
  card.append(body);
  return card;
}

function renderSection(section, id) {
  const element = node('section', 'section');
  element.id = id;
  element.append(node('h2', '', section.title || '未命名栏目'));
  if (section.description) element.append(node('p', 'section-description', section.description));
  const grid = node('div', 'cards');
  const columns = [1, 2, 3].includes(section.columns) ? section.columns : 2;
  grid.style.setProperty('--cols', columns);
  grid.dataset.cols = columns;
  grid.append(...section.items.map(renderCard));
  element.append(grid);
  return element;
}


function renderQuickNav(targets) {
  const nav = node('nav', 'quick-nav');
  nav.setAttribute('aria-label', '页面快捷导航');

  const panel = node('div', 'quick-nav-panel');
  panel.id = 'quick-nav-panel';
  panel.hidden = true;
  panel.append(node('p', 'quick-nav-title', '快速跳转'));
  const toggle = node('button', 'quick-nav-toggle', '☷ 目录');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '打开栏目导航');

  const closeMenu = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开栏目导航');
  };

  for (const target of targets) {
    const jump = node('a', 'quick-nav-link', target.title);
    jump.href = '#' + target.id;
    jump.addEventListener('click', closeMenu);
    panel.append(jump);
  }

  toggle.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? '关闭栏目导航' : '打开栏目导航');
  });

  const top = node('button', 'quick-nav-top', '↑ 顶部');
  top.type = 'button';
  top.setAttribute('aria-label', '返回页面顶部');
  top.addEventListener('click', () => {
    closeMenu();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  const controls = node('div', 'quick-nav-controls');
  controls.append(toggle, top);
  nav.append(panel, controls);
  return nav;
}

document.addEventListener('click', event => {
  const nav = site.querySelector('.quick-nav');
  if (!nav || nav.contains(event.target)) return;
  const panel = nav.querySelector('.quick-nav-panel');
  const toggle = nav.querySelector('.quick-nav-toggle');
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '打开栏目导航');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const nav = site.querySelector('.quick-nav');
  const panel = nav?.querySelector('.quick-nav-panel');
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  const toggle = nav.querySelector('.quick-nav-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '打开栏目导航');
  toggle.focus();
});

function render(data) {
  if (!Array.isArray(data.sections) || !data.sections.every(section => Array.isArray(section.items))) {
    throw new Error('Invalid contents');
  }
  const accent = /^#[a-f\d]{6}$/i.test(data.accent) ? data.accent : '#f495ca';
  document.documentElement.style.setProperty('--accent', accent);
  document.title = [data.title, data.subtitle].filter(Boolean).join(' · ');
  const hero = node('section', 'hero frame');
  const ornament = node('div', 'divider', '✦');
  ornament.setAttribute('aria-hidden', 'true');
  hero.append(node('p', 'hero-kicker', 'Bluntcore Intimacy Lab'),
    node('h1', '', data.title), node('h2', '', data.subtitle), ornament,
    node('p', 'intro', data.description));
  if (data.notice) hero.append(node('p', 'notice', data.notice));
  const cover = picture(data.cover, 'hero-cover');
  if (cover) hero.append(cover);
  const jumps = node('nav', 'jumps');
  jumps.setAttribute('aria-label', '栏目导航');
  const directory = node('div', 'directory frame');
  const jumpTargets = [];
  for (const [index, section] of data.sections.entries()) {
    const id = /^[a-z][a-z\d-]*$/.test(section.id) ? `section-${section.id}-${index}` : `section-${index}`;
    const jump = node('a', '', section.title || '未命名栏目');
    jump.href = `#${id}`;
    jumpTargets.push({ id, title: section.title || '未命名栏目' });
    jumps.append(jump);
    directory.append(renderSection(section, id));
  }
  if (jumps.childElementCount) hero.append(jumps);
  site.replaceChildren(hero, directory, node('footer', 'bottom frame', data.footer), renderQuickNav(jumpTargets));
}

if (inPreview) {
  window.addEventListener('message', event => {
    if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'preview') {
      render(event.data.content);
    }
  });
  window.parent.postMessage({ type: 'preview-ready' }, location.origin);
} else {
  try {
    const response = await fetch('./content.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not load contents');
    render(await response.json());
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    const fallback = node('a', 'frame status', '暂时无法加载。前往 GitHub 阅读目录 ↗');
    fallback.href = `${repo}#readme`;
    site.replaceChildren(fallback);
  }
}
