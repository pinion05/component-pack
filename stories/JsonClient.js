import './JsonClient.css';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isArray = (v) => Array.isArray(v);

function createLine({ key, value, depth }) {
  const line = document.createElement('div');
  line.className = 'jc-line';
  line.dataset.depth = String(depth);

  const toggle = document.createElement('span');
  toggle.className = 'jc-toggle';

  const keySpan = document.createElement('span');
  keySpan.className = 'jc-key';
  if (typeof key !== 'undefined' && key !== null) keySpan.textContent = String(key);

  const sep = document.createElement('span');
  sep.className = 'jc-sep';
  sep.textContent = typeof key !== 'undefined' ? ':' : '';

  const valueSpan = document.createElement('span');

  if (isObject(value)) {
    valueSpan.innerHTML = `<span class="jc-brace">{</span> <span class="jc-sep">…</span> <span class="jc-brace">}</span>`;
  } else if (isArray(value)) {
    valueSpan.innerHTML = `<span class="jc-brace">[</span> <span class="jc-sep">…</span> <span class="jc-brace">]</span>`;
  } else if (typeof value === 'string') {
    valueSpan.className = 'jc-type-string';
    valueSpan.textContent = JSON.stringify(value);
  } else if (typeof value === 'number') {
    valueSpan.className = 'jc-type-number';
    valueSpan.textContent = String(value);
  } else if (typeof value === 'boolean') {
    valueSpan.className = 'jc-type-boolean';
    valueSpan.textContent = String(value);
  } else if (value === null) {
    valueSpan.className = 'jc-type-null';
    valueSpan.textContent = 'null';
  } else {
    valueSpan.textContent = String(value);
  }

  line.appendChild(toggle);
  line.appendChild(keySpan);
  line.appendChild(sep);
  line.appendChild(valueSpan);
  return { line, toggle, keySpan, valueSpan };
}

function renderNode(value, { key, depth }) {
  const { line, toggle } = createLine({ key, value, depth });
  const wrapper = document.createElement('div');
  wrapper.appendChild(line);

  if (isObject(value) || isArray(value)) {
    wrapper.classList.add('is-collapsible');
    const children = document.createElement('div');
    children.className = 'jc-children';

    const entries = isArray(value) ? value.map((v, i) => [i, v]) : Object.keys(value).map((k) => [k, value[k]]);
    for (const [k, v] of entries) {
      const child = renderNode(v, { key: k, depth: depth + 1 });
      children.appendChild(child);
    }

    let expanded = depth < 1; // root expanded, nested collapsed by default
    wrapper.classList.toggle('is-collapsed', !expanded);
    toggle.textContent = expanded ? '▾' : '▸';
    toggle.style.visibility = 'visible';
    toggle.addEventListener('click', () => {
      expanded = !expanded;
      wrapper.classList.toggle('is-collapsed', !expanded);
      toggle.textContent = expanded ? '▾' : '▸';
    });

    wrapper.appendChild(children);
  } else {
    toggle.style.visibility = 'hidden';
  }

  return wrapper;
}

function buildTreeView(jsonObj) {
  const root = document.createElement('div');
  root.className = 'jc-tree';
  root.appendChild(renderNode(jsonObj, { key: undefined, depth: 0 }));
  return root;
}

function expandCollapseAll(container, expand) {
  container.querySelectorAll('.is-collapsible').forEach((node) => {
    node.classList.toggle('is-collapsed', !expand);
    const t = node.querySelector(':scope > .jc-line > .jc-toggle');
    if (t) t.textContent = expand ? '▾' : '▸';
  });
}

function applySearch(container, term) {
  const q = term.trim().toLowerCase();
  container.querySelectorAll('.jc-line').forEach((line) => line.classList.remove('match'));
  if (!q) return;
  const lines = container.querySelectorAll('.jc-line');
  lines.forEach((line) => {
    const text = line.textContent.toLowerCase();
    if (text.includes(q)) {
      line.classList.add('match');
      // expand ancestors
      let n = line.parentElement;
      while (n && n !== container) {
        if (n.classList && n.classList.contains('is-collapsible')) {
          n.classList.remove('is-collapsed');
          const t = n.querySelector(':scope > .jc-line > .jc-toggle');
          if (t) t.textContent = '▾';
        }
        n = n.parentElement;
      }
    }
  });
}

export const createJsonClient = ({ json = '{\n  "message": "hello"\n}', height = 360 } = {}) => {
  const container = document.createElement('section');
  container.className = 'json-client';

  const editor = document.createElement('textarea');
  editor.className = 'json-client__editor';
  editor.value = json;
  editor.style.minHeight = '120px';

  const toolbar = document.createElement('div');
  toolbar.className = 'json-client__toolbar';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'json-client__btn';
  applyBtn.textContent = '적용';

  const expandBtn = document.createElement('button');
  expandBtn.className = 'json-client__btn secondary';
  expandBtn.textContent = '모두 펼치기';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'json-client__btn secondary';
  collapseBtn.textContent = '모두 접기';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'json-client__btn secondary';
  copyBtn.textContent = '전체 복사';

  const searchInput = document.createElement('input');
  searchInput.className = 'json-client__search';
  searchInput.placeholder = '검색(키/값)…';

  toolbar.appendChild(applyBtn);
  toolbar.appendChild(expandBtn);
  toolbar.appendChild(collapseBtn);
  toolbar.appendChild(copyBtn);
  toolbar.appendChild(searchInput);

  const viewer = document.createElement('div');
  viewer.className = 'json-client__viewer';
  viewer.style.maxHeight = `${height}px`;

  const errorBox = document.createElement('div');
  errorBox.className = 'json-client__error';
  errorBox.style.display = 'none';

  const render = () => {
    viewer.innerHTML = '';
    errorBox.style.display = 'none';
    try {
      const obj = JSON.parse(editor.value);
      const tree = buildTreeView(obj);
      viewer.appendChild(tree);
    } catch (e) {
      errorBox.textContent = `JSON 파싱 오류: ${e.message}`;
      errorBox.style.display = '';
    }
  };

  applyBtn.addEventListener('click', render);
  expandBtn.addEventListener('click', () => expandCollapseAll(viewer, true));
  collapseBtn.addEventListener('click', () => expandCollapseAll(viewer, false));
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(editor.value); } catch {}
  });
  searchInput.addEventListener('input', () => applySearch(viewer, searchInput.value));

  // initial render
  render();

  container.appendChild(editor);
  container.appendChild(toolbar);
  container.appendChild(errorBox);
  container.appendChild(viewer);
  return container;
};

