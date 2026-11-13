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
  for (const [index, section] of data.sections.entries()) {
    const id = /^[a-z][a-z\d-]*$/.test(section.id) ? `section-${section.id}-${index}` : `section-${index}`;
    const jump = node('a', '', section.title || '未命名栏目');
    jump.href = `#${id}`;
    jumps.append(jump);
    directory.append(renderSection(section, id));
  }
  if (jumps.childElementCount) hero.append(jumps);
  site.replaceChildren(hero, directory, node('footer', 'bottom frame', data.footer));
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
