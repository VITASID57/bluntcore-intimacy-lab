const draftKey = 'bluntcore-pages-content-v1';
const form = document.querySelector('#form');
const preview = document.querySelector('#preview');
const viewport = document.querySelector('#preview-viewport');
const status = document.querySelector('#status');
const exportButton = document.querySelector('#export');
const importInput = document.querySelector('#import');
let content;
let drag;
let queued = false;

function updatePreview() {
  if (content) preview.contentWindow?.postMessage({ type: 'preview', content }, location.origin);
}

function update() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    updatePreview();
    try {
      localStorage.setItem(draftKey, JSON.stringify(content));
      status.textContent = '草稿已保存在此浏览器。';
    } catch {
      status.textContent = '草稿太大，无法保存在浏览器。请先导出备份。';
    }
  });
}

function button(label, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.onclick = onClick;
  return element;
}

function group(label, open = false) {
  const details = document.createElement('details');
  details.className = 'editor-group';
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = label;
  details.append(summary);
  return details;
}

function field(label, object, key, type = 'text', onInput) {
  const wrapper = document.createElement('label');
  wrapper.className = 'editor-field';
  const control = document.createElement(type === 'textarea' ? 'textarea' : type === 'columns' ? 'select' : 'input');
  if (type === 'columns') {
    for (const number of [1, 2, 3]) control.add(new Option(`${number} 栏`, number));
  } else if (type !== 'textarea') {
    control.type = type;
  }
  control.value = object[key] ?? '';
  control.oninput = () => {
    object[key] = type === 'columns' ? Number(control.value) : control.value;
    onInput?.(control.value);
    update();
  };
  wrapper.append(label, control);
  return wrapper;
}

async function encodeImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('请选择 PNG、JPEG、WebP 或 GIF 图片。');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', .82);
  } finally {
    bitmap.close();
  }
}

function imageFields(parent, object, key) {
  const urlField = field('图片地址（可留空）', object, key);
  const urlInput = urlField.querySelector('input');
  if (object[key]?.startsWith('data:')) {
    urlInput.value = '';
    urlInput.placeholder = '已选择本地图片';
  }
  const wrapper = document.createElement('label');
  wrapper.className = 'editor-field';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp,image/gif';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      object[key] = await encodeImage(file);
      urlInput.value = '';
      urlInput.placeholder = '已选择本地图片';
      update();
    } catch (error) {
      status.textContent = error.message || '无法读取这张图片。';
    } finally {
      input.value = '';
    }
  };
  wrapper.append('从设备选图', input);
  const clear = button('移除图片', () => {
    object[key] = '';
    urlInput.value = '';
    urlInput.placeholder = '';
    update();
  });
  parent.append(urlField, wrapper, clear);
}

function move(list, from, to) {
  if (from === to || to < 0 || to >= list.length) return;
  list.splice(to, 0, list.splice(from, 1)[0]);
  render();
  update();
}

function orderControls(element, list, index, label) {
  const row = document.createElement('div');
  row.className = 'row-actions';
  const handle = button('拖动排序', () => {});
  handle.className = 'drag';
  handle.draggable = true;
  handle.ondragstart = event => {
    drag = { list, index };
    event.dataTransfer.setData('text/plain', label);
    event.dataTransfer.effectAllowed = 'move';
  };
  handle.ondragend = () => { drag = null; };
  element.ondragover = event => {
    if (drag?.list !== list) return;
    event.preventDefault();
    event.stopPropagation();
    element.dataset.dropTarget = '';
  };
  element.ondragleave = event => {
    if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) delete element.dataset.dropTarget;
  };
  element.ondrop = event => {
    if (drag?.list !== list) return;
    event.preventDefault();
    event.stopPropagation();
    delete element.dataset.dropTarget;
    move(list, drag.index, index);
    drag = null;
  };
  const up = button('上移', () => move(list, index, index - 1));
  const down = button('下移', () => move(list, index, index + 1));
  up.disabled = index === 0;
  down.disabled = index === list.length - 1;
  const remove = button('删除', () => {
    if (!confirm(`删除「${label}」？`)) return;
    list.splice(index, 1);
    render();
    update();
  });
  row.append(handle, up, down, remove);
  element.append(row);
}

function fields(groupElement) {
  const container = document.createElement('div');
  container.className = 'editor-fields';
  groupElement.append(container);
  return container;
}

function renderItem(item, list, index) {
  const label = item.title || '新卡片';
  const element = group(label, !item.title);
  const itemFields = fields(element);
  itemFields.append(
    field('卡片标题', item, 'title', 'text', value => { element.firstChild.textContent = value || '新卡片'; }),
    field('简介', item, 'description', 'textarea'),
    field('跳转地址', item, 'url'),
  );
  imageFields(itemFields, item, 'image');
  orderControls(element, list, index, label);
  return element;
}

function renderSection(section, index) {
  const label = section.title || '新栏目';
  const element = group(label, true);
  const sectionFields = fields(element);
  sectionFields.append(
    field('栏目标题', section, 'title', 'text', value => { element.firstChild.textContent = value || '新栏目'; }),
    field('栏目简介', section, 'description', 'textarea'),
    field('宽屏列数', section, 'columns', 'columns'),
  );
  orderControls(element, content.sections, index, label);
  element.append(...section.items.map((item, itemIndex) => renderItem(item, section.items, itemIndex)));
  element.append(button('添加卡片', () => {
    section.items.push({ title: '', description: '', url: '', image: '' });
    render();
    update();
  }));
  return element;
}

function render() {
  const header = group('首页封面与文案');
  const headerFields = fields(header);
  headerFields.append(
    field('主标题', content, 'title'),
    field('副标题', content, 'subtitle'),
    field('首页介绍', content, 'description', 'textarea'),
    field('阅读提示', content, 'notice'),
    field('页脚', content, 'footer'),
    field('点缀色', content, 'accent', 'color'),
  );
  imageFields(headerFields, content, 'cover');
  form.replaceChildren(header, ...content.sections.map(renderSection), button('添加栏目', () => {
    content.sections.push({ id: `new-${Date.now()}`, title: '', description: '', columns: 2, items: [] });
    render();
    update();
  }));
}

function validate(data) {
  const isText = value => typeof value === 'string';
  const hasText = (value, keys) => value && keys.every(key => isText(value[key]));
  if (!hasText(data, ['title', 'subtitle', 'description', 'notice', 'footer', 'cover', 'accent'])
    || !Array.isArray(data.sections)
    || !data.sections.every(section => hasText(section, ['id', 'title', 'description'])
      && [1, 2, 3].includes(section.columns)
      && Array.isArray(section.items)
      && section.items.every(item => hasText(item, ['title', 'description', 'url', 'image'])))) {
    throw new Error('这个 JSON 不是钝核编辑器导出的页面内容。');
  }
  return data;
}

function resizePreview() {
  const width = phoneMode ? Math.min(390, viewport.clientWidth) : Math.max(1100, viewport.clientWidth);
  if (!width || !viewport.clientHeight) return;
  const scale = Math.min(1, viewport.clientWidth / width);
  preview.style.width = width + 'px';
  preview.style.height = viewport.clientHeight / scale + 'px';
  preview.style.transform = 'scale(' + scale + ')';
}
let phoneMode = matchMedia('(max-width: 52rem)').matches;
new ResizeObserver(resizePreview).observe(viewport);
function setPreviewMode(usePhoneWidth) {
  phoneMode = usePhoneWidth;
  resizePreview();
  document.querySelector('#desktop').setAttribute('aria-pressed', String(!phoneMode));
  document.querySelector('#phone').setAttribute('aria-pressed', String(phoneMode));
}
setPreviewMode(phoneMode);
document.querySelector('#desktop').onclick = () => setPreviewMode(false);
document.querySelector('#phone').onclick = () => setPreviewMode(true);
window.addEventListener('message', event => {
  if (event.source === preview.contentWindow && event.origin === location.origin && event.data?.type === 'preview-ready') updatePreview();
});

exportButton.onclick = () => {
  const blob = new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'content.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
importInput.onchange = async () => {
  try {
    const [file] = importInput.files;
    if (!file) return;
    content = validate(JSON.parse(await file.text()));
    render();
    exportButton.disabled = false;
    update();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    importInput.value = '';
  }
};

async function loadPublished() {
  const response = await fetch('./content.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('暂时无法载入线上版本。');
  return validate(await response.json());
}

const loadButton = document.querySelector('#load-published');
loadButton.onclick = async () => {
  if (!confirm('用线上版本替换这个浏览器的草稿？')) return;
  try {
    content = await loadPublished();
    render();
    update();
  } catch (error) {
    status.textContent = error.message;
  }
};

try {
  let draft;
  try {
    const stored = localStorage.getItem(draftKey);
    if (stored) draft = validate(JSON.parse(stored));
  } catch { /* The published content is still available. */ }
  if (draft) {
    content = draft;
    status.textContent = '已恢复此浏览器的草稿。';
  } else {
    content = await loadPublished();
  }
  render();
  updatePreview();
  exportButton.disabled = false;
  importInput.disabled = false;
  loadButton.disabled = false;
} catch {
  status.textContent = '暂时无法载入页面内容，请刷新后重试。';
  importInput.disabled = false;
}
