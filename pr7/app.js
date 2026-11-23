'use strict';

// ============================================================================
// ЧИСТІ ФУНКЦІЇ БІЗНЕС-ЛОГІКИ (Ізольовані від DOM для Unit-тестування)
// ============================================================================

const ALLOWED_STATES = ['loading', 'content', 'empty', 'error'];

/**
 * Перевіряє валідність назви стану екрана
 * @param {unknown} state
 * @returns {boolean}
 */
function isValidState(state) {
  return typeof state === 'string' && ALLOWED_STATES.includes(state);
}

/**
 * Валідує текстове введення (непорожній рядок після trim, обмеження довжини)
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {{ valid: boolean, error: string }}
 */
function validateInput(value, maxLength = 300) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Некоректний тип даних: очікується рядок.' };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Поле не може бути порожнім або містити лише пробіли.' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Перевищено максимальну довжину (${maxLength} символів).` };
  }

  return { valid: true, error: '' };
}

/**
 * Чиста функція фільтрації масиву модулів за пошуковим запитом
 * @param {Array<{title: string, category: string, description: string}>} items
 * @param {unknown} query
 * @returns {Array}
 */
function filterModules(items, query) {
  if (!Array.isArray(items)) return [];
  if (typeof query !== 'string') return [...items];

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === '') return [...items];

  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery)
  );
}

// ============================================================================
// ОСНОВНА ЛОГІКА ВЗАЄМОДІЇ З DOM
// ============================================================================

const INITIAL_MODULES = [
  {
    id: 1,
    category: 'UI/UX Design',
    title: 'Архітектура дизайн-систем',
    description: 'Побудова трирівневої ієрархії токенів: Primitive, Semantic та Component.',
    duration: '45 хв'
  },
  {
    id: 2,
    category: 'Frontend',
    title: 'Життєвий цикл Screen States',
    description: 'Моделювання станів Loading, Content, Empty та Error у динамічних SPA.',
    duration: '60 хв'
  },
  {
    id: 3,
    category: 'Accessibility',
    title: 'Семантика та доступність (a11y)',
    description: 'Правильне використання тегів button, label та керування фокусом з клавіатури.',
    duration: '30 хв'
  },
  {
    id: 4,
    category: 'QA & Security',
    title: 'Захист від XSS та Unit Assertions',
    description: 'Безпечний вивід даних через textContent та перевірка бізнес-логіки через console.assert.',
    duration: '50 хв'
  }
];

let modules = [...INITIAL_MODULES];
let loadingTimerId = null;

const stateContainers = document.querySelectorAll('[data-state]');
const switcherButtons = document.querySelectorAll('[data-switch-state]');
const cardsContainer = document.getElementById('cards-container');
const searchInput = document.getElementById('search-input');
const emptyQueryLabel = document.getElementById('empty-query-label');
const btnRefresh = document.getElementById('btn-refresh');
const btnClearAll = document.getElementById('btn-clear-all');
const btnEmptyReset = document.getElementById('btn-empty-reset');
const btnErrorRetry = document.getElementById('btn-error-retry');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

const addModuleForm = document.getElementById('add-module-form');
const moduleTitleInput = document.getElementById('module-title-input');
const moduleDescInput = document.getElementById('module-desc-input');
const formFeedback = document.getElementById('form-feedback');

function renderState(targetState) {
  if (!isValidState(targetState)) return;

  stateContainers.forEach((container) => {
    const isTarget = container.dataset.state === targetState;
    container.classList.toggle('is-hidden', !isTarget);
  });

  switcherButtons.forEach((btn) => {
    const isCurrent = btn.dataset.switchState === targetState;
    btn.classList.toggle('is-active', isCurrent);
    btn.setAttribute('aria-pressed', String(isCurrent));
  });
}

/**
 * Безпечний рендеринг карток виключно через textContent (захист від XSS)
 */
function renderCards(items) {
  if (!items || items.length === 0) {
    const rawQuery = searchInput ? searchInput.value.trim() : '';
    if (emptyQueryLabel) {
      emptyQueryLabel.textContent = rawQuery ? `"${rawQuery}"` : 'усі записи';
    }
    renderState('empty');
    return;
  }

  cardsContainer.textContent = '';

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'card';

    const bodyDiv = document.createElement('div');

    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = item.category;

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = item.description;

    bodyDiv.append(badge, title, desc);

    const footerDiv = document.createElement('div');
    footerDiv.className = 'card-footer';

    const meta = document.createElement('span');
    meta.className = 'card-meta';
    meta.textContent = `Тривалість: ${item.duration}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.dataset.deleteId = String(item.id);
    deleteBtn.textContent = 'Видалити';

    footerDiv.append(meta, deleteBtn);
    article.append(bodyDiv, footerDiv);
    cardsContainer.appendChild(article);
  });

  renderState('content');
}

function applyFilterAndRender() {
  const filtered = filterModules(modules, searchInput.value);
  renderCards(filtered);
}

function simulateAsyncLoad() {
  if (loadingTimerId !== null) {
    window.clearTimeout(loadingTimerId);
  }

  renderState('loading');

  loadingTimerId = window.setTimeout(() => {
    loadingTimerId = null;
    applyFilterAndRender();
  }, 1500);
}

function resetDataAndFilters() {
  searchInput.value = '';
  modules = [...INITIAL_MODULES];
  renderCards(modules);
}

// Обробник форми додавання нового модуля з валідацією
if (addModuleForm) {
  addModuleForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const titleCheck = validateInput(moduleTitleInput.value, 300);
    const descCheck = validateInput(moduleDescInput.value, 300);

    moduleTitleInput.classList.toggle('is-error', !titleCheck.valid);
    moduleDescInput.classList.toggle('is-error', !descCheck.valid);

    if (!titleCheck.valid || !descCheck.valid) {
      formFeedback.textContent = !titleCheck.valid ? titleCheck.error : descCheck.error;
      formFeedback.classList.remove('is-hidden');
      return;
    }

    formFeedback.classList.add('is-hidden');
    formFeedback.textContent = '';

    const newModule = {
      id: Date.now(),
      category: 'Custom Module',
      title: moduleTitleInput.value.trim(),
      description: moduleDescInput.value.trim(),
      duration: '35 хв'
    };

    modules.unshift(newModule);
    addModuleForm.reset();
    searchInput.value = '';
    renderCards(modules);
  });
}

// Перемикач станів
switcherButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (loadingTimerId !== null) {
      window.clearTimeout(loadingTimerId);
      loadingTimerId = null;
    }

    const nextState = btn.dataset.switchState;
    if (nextState === 'content' && modules.length === 0) {
      modules = [...INITIAL_MODULES];
      renderCards(modules);
    } else if (nextState === 'content') {
      applyFilterAndRender();
    } else {
      renderState(nextState);
    }
  });
});

searchInput.addEventListener('input', applyFilterAndRender);

cardsContainer.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('[data-delete-id]');
  if (!deleteBtn) return;

  const idToRemove = Number(deleteBtn.dataset.deleteId);
  modules = modules.filter((item) => item.id !== idToRemove);
  applyFilterAndRender();
});

btnClearAll.addEventListener('click', () => {
  modules = [];
  renderCards(modules);
});

btnRefresh.addEventListener('click', simulateAsyncLoad);
btnErrorRetry.addEventListener('click', simulateAsyncLoad);
btnEmptyReset.addEventListener('click', resetDataAndFilters);

btnThemeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';

  if (isDark) {
    root.removeAttribute('data-theme');
    btnThemeToggle.textContent = 'Темна тема';
    btnThemeToggle.setAttribute('aria-pressed', 'false');
  } else {
    root.setAttribute('data-theme', 'dark');
    btnThemeToggle.textContent = 'Світла тема';
    btnThemeToggle.setAttribute('aria-pressed', 'true');
  }
});

// Ініціалізація додатку
renderCards(modules);