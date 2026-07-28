const state = {
  category: new URLSearchParams(location.search).get('category') || '',
  q: new URLSearchParams(location.search).get('q') || '',
  page: 1,
  limit: 18,
  total: 0,
};

const grid = document.getElementById('grid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const resultSummary = document.getElementById('resultSummary');

document.getElementById('pageSearch').value = state.q;

async function loadCategories() {
  try {
    const { categories } = await api('/api/categories');
    const tabs = document.getElementById('tabs');
    const extra = (categories || []).map((c) => `<span class="tab ${state.category === c.category ? 'active' : ''}" data-cat="${escapeHTML(c.category)}">${escapeHTML(c.category)} (${c.count})</span>`).join('');
    tabs.innerHTML = `<span class="tab ${!state.category ? 'active' : ''}" data-cat="">All</span>` + extra;
    tabs.querySelectorAll('.tab').forEach((el) => {
      el.addEventListener('click', () => {
        state.category = el.dataset.cat;
        state.page = 1;
        tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        el.classList.add('active');
        const url = new URL(location.href);
        if (state.category) url.searchParams.set('category', state.category); else url.searchParams.delete('category');
        history.replaceState(null, '', url);
        fetchWallpapers(true);
      });
    });
  } catch (e) { /* tabs are optional decoration; ignore failure */ }
}

async function fetchWallpapers(reset = false) {
  if (reset) grid.innerHTML = `<div class="skeleton" style="aspect-ratio:9/16"></div>`.repeat(6);
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  if (state.category) params.set('category', state.category);
  if (state.q) params.set('q', state.q);
  try {
    const { wallpapers, total } = await api(`/api/wallpapers?${params}`);
    state.total = total || 0;
    resultSummary.textContent = state.total ? `${state.total} wallpaper${state.total === 1 ? '' : 's'} found` : 'No wallpapers found';
    if (reset) grid.innerHTML = '';
    if (!wallpapers || !wallpapers.length) {
      if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No wallpapers here yet.</div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }
    grid.insertAdjacentHTML('beforeend', wallpapers.map(wallCardHTML).join(''));
    loadMoreBtn.style.display = state.page * state.limit < state.total ? 'inline-flex' : 'none';
  } catch (e) {
    if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load wallpapers. Is the backend URL set in js/config.js?</div>`;
  }
}

loadMoreBtn.addEventListener('click', () => { state.page += 1; fetchWallpapers(false); });

document.getElementById('pageSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    state.q = e.target.value.trim();
    state.page = 1;
    const url = new URL(location.href);
    if (state.q) url.searchParams.set('q', state.q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    fetchWallpapers(true);
  }
});

loadCategories();
fetchWallpapers(true);
