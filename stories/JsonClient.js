import './JsonClient.css';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isArray = (v) => Array.isArray(v);

function getValueAtPath(obj, path) {
  return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setValueAtPath(obj, path, newVal) {
  if (!path.length) return newVal;
  const lastKey = path[path.length - 1];
  const parent = getValueAtPath(obj, path.slice(0, -1));
  parent[lastKey] = newVal;
  return obj;
}

function createLine({ key, value, depth, mode = 'friendly', isArrayItem = false, path = [] }) {
  const line = document.createElement('div');
  line.className = 'jc-line';
  line.dataset.depth = String(depth);
  // no full-line backgrounds; value will be styled as a chip instead

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
    if (mode === 'friendly') {
      const size = Object.keys(value).length;
      valueSpan.innerHTML = `<span class="jc-pill">${size}개 키</span>`;
    } else {
      valueSpan.innerHTML = `<span class="jc-brace">{</span> <span class="jc-sep">…</span> <span class="jc-brace">}</span>`;
    }
  } else if (isArray(value)) {
    if (mode === 'friendly') {
      const size = value.length;
      valueSpan.innerHTML = `<span class="jc-pill">${size}개 항목</span>`;
    } else {
      valueSpan.innerHTML = `<span class="jc-brace">[</span> <span class="jc-sep">…</span> <span class="jc-brace">]</span>`;
    }
  } else if (typeof value === 'string') {
    valueSpan.className = 'jc-chip jc-type-string';
    valueSpan.dataset.vtype = 'string';
    valueSpan.dataset.path = JSON.stringify(path);
    valueSpan.textContent = mode === 'friendly' ? value : JSON.stringify(value);
  } else if (typeof value === 'number') {
    valueSpan.className = 'jc-chip jc-type-number';
    valueSpan.dataset.vtype = 'number';
    valueSpan.dataset.path = JSON.stringify(path);
    valueSpan.textContent = String(value);
  } else if (typeof value === 'boolean') {
    valueSpan.className = 'jc-chip jc-type-boolean';
    valueSpan.dataset.vtype = 'boolean';
    valueSpan.dataset.path = JSON.stringify(path);
    valueSpan.textContent = String(value);
  } else if (value === null) {
    valueSpan.className = 'jc-chip jc-type-null';
    valueSpan.dataset.vtype = 'null';
    valueSpan.dataset.path = JSON.stringify(path);
    valueSpan.textContent = 'null';
  } else {
    valueSpan.textContent = String(value);
  }

  line.appendChild(toggle);
  if (mode === 'friendly' && isArrayItem) {
    const bullet = document.createElement('span');
    bullet.className = 'jc-bullet';
    bullet.textContent = '•';
    line.appendChild(bullet);
  } else {
    line.appendChild(keySpan);
    line.appendChild(sep);
  }
  line.appendChild(valueSpan);
  return { line, toggle, keySpan, valueSpan };
}

function renderNode(value, { key, depth, mode = 'friendly', isArrayItem = false, path = [] }) {
  const { line, toggle } = createLine({ key, value, depth, mode, isArrayItem, path });
  const wrapper = document.createElement('div');
  wrapper.appendChild(line);
  wrapper.dataset.path = JSON.stringify(path);

  if (isObject(value) || isArray(value)) {
    wrapper.classList.add('is-collapsible');
    const children = document.createElement('div');
    children.className = 'jc-children';

    const entries = isArray(value) ? value.map((v, i) => [i, v]) : Object.keys(value).map((k) => [k, value[k]]);
    for (const [k, v] of entries) {
      const child = renderNode(v, {
        key: mode === 'friendly' && isArray(value) ? undefined : k,
        depth: depth + 1,
        mode,
        isArrayItem: isArray(value),
        path: [...path, k]
      });
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

function buildTreeView(jsonObj, mode = 'friendly') {
  const root = document.createElement('div');
  root.className = 'jc-tree';
  root.appendChild(renderNode(jsonObj, { key: undefined, depth: 0, mode, isArrayItem: false, path: [] }));
  return root;
}

function getExpandedPaths(container) {
  const paths = [];
  container.querySelectorAll('.is-collapsible').forEach((node) => {
    if (!node.classList.contains('is-collapsed')) {
      const p = node.dataset.path;
      if (p) paths.push(p);
    }
  });
  return paths;
}

function applyExpandedPaths(container, expandedSet) {
  container.querySelectorAll('.is-collapsible').forEach((node) => {
    const p = node.dataset.path;
    if (p && expandedSet.has(p)) {
      node.classList.remove('is-collapsed');
      const t = node.querySelector(':scope > .jc-line > .jc-toggle');
      if (t) t.textContent = '▾';
    }
  });
}

function setupInlineEditing(container, editor, mode, obj, rerender) {
  const chips = container.querySelectorAll('.jc-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (chip.dataset.editing === '1') return;
      chip.dataset.editing = '1';

      const vtype = chip.dataset.vtype;
      let path = [];
      try { path = JSON.parse(chip.dataset.path || '[]'); } catch {}
      const original = getValueAtPath(obj, path);

      const input = document.createElement('input');
      input.className = 'jc-inline-input';
      input.type = 'text';
      input.value = vtype === 'string' ? String(original ?? '') : String(original);
      chip.replaceWith(input);
      input.focus();
      input.select();

      const tryParse = (txt) => {
        if (vtype === 'string') return String(txt);
        if (vtype === 'number') {
          if (txt.trim() === '') return NaN;
          const n = Number(txt);
          return Number.isFinite(n) ? n : NaN;
        }
        if (vtype === 'boolean') {
          const t = txt.trim().toLowerCase();
          if (t === 'true') return true;
          if (t === 'false') return false;
          return Symbol('invalid');
        }
        if (vtype === 'null') {
          const t = txt.trim().toLowerCase();
          if (t === 'null' || t === '') return null;
          return Symbol('invalid');
        }
        return txt;
      };

      const finish = (commit) => {
        const newText = input.value;
        if (commit) {
          const parsed = tryParse(newText);
          const invalid = (vtype === 'number' && Number.isNaN(parsed)) || (typeof parsed === 'symbol');
          if (!invalid) {
            const objCopy = JSON.parse(editor.value);
            setValueAtPath(objCopy, path, parsed);
            editor.value = JSON.stringify(objCopy, null, 2);
            rerender(); // resets tree state as requested
            return;
          } else {
            // show a lightweight error and keep input focused
            input.classList.add('jc-input-error');
            input.focus();
            input.select();
            return;
          }
        }
        // cancel: simply rerender to restore original chips and handlers
        rerender();
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      });
      input.addEventListener('blur', () => finish(true));
    });
  });
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

  const modeBtn = document.createElement('button');
  modeBtn.className = 'json-client__btn secondary';
  modeBtn.textContent = '개발자 보기';

  const searchInput = document.createElement('input');
  searchInput.className = 'json-client__search';
  searchInput.placeholder = '검색(키/값)…';

  toolbar.appendChild(applyBtn);
  toolbar.appendChild(expandBtn);
  toolbar.appendChild(collapseBtn);
  toolbar.appendChild(copyBtn);
  toolbar.appendChild(modeBtn);
  toolbar.appendChild(searchInput);

  const viewer = document.createElement('div');
  viewer.className = 'json-client__viewer';
  viewer.style.maxHeight = `${height}px`;

  const errorBox = document.createElement('div');
  errorBox.className = 'json-client__error';
  errorBox.style.display = 'none';

  let mode = 'friendly'; // 'friendly' | 'developer'

  const render = () => {
    const expandedBefore = getExpandedPaths(viewer);
    const prevScroll = viewer.scrollTop;
    viewer.innerHTML = '';
    errorBox.style.display = 'none';
    try {
      const obj = JSON.parse(editor.value);
      const tree = buildTreeView(obj, mode);
      viewer.appendChild(tree);
      applyExpandedPaths(viewer, new Set(expandedBefore));
      viewer.scrollTop = prevScroll;
      setupInlineEditing(viewer, editor, mode, obj, render);
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
  modeBtn.addEventListener('click', () => {
    mode = mode === 'friendly' ? 'developer' : 'friendly';
    modeBtn.textContent = mode === 'friendly' ? '개발자 보기' : '일반 보기';
    render();
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
