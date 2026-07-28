const state = {
  category: new URLSearchParams(location.search).get('category') || '',
  q: new URLSearchParams(location.search).get('q') || '',
  offset: 0,
  limit: 18,
  total: 0,
};

const grid = document.getElementById('grid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const resultSummary = document.getElementById('resultSummary');

document.getElementById('pageSearch').value = state.q;

async function loadCategories() {
  try {
    const { categories } = await api('/api/categories'); // [{ category, c }]
    const tabs = document.getElementById('tabs');
    const extra = (categories || []).map((c) => `<span class="tab ${state.category === c.category ? 'active' : ''}" data-cat="${escapeHTML(c.category)}">${escapeHTML(c.category)} (${c.c})</span>`).join('');
    tabs.innerHTML = `<span class="tab ${!state.category ? 'active' : ''}" data-cat="">All</span>` + extra;
    tabs.querySelectorAll('.tab').forEach((el) => {
      el.addEventListener('click', () => {
        state.category = el.dataset.cat;
        state.offset = 0;
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
  if (reset) { state.offset = 0; grid.innerHTML = `<div class="skeleton" style="aspect-ratio:9/16"></div>`.repeat(6); }
  const params = new URLSearchParams({ offset: state.offset, limit: state.limit });
  if (state.category) params.set('cat', state.category);
  if (state.q) params.set('q', state.q);
  try {
    const { walls, total } = await api(`/api/walls?${params}`);
    state.total = total || 0;
    resultSummary.textContent = state.total ? `${state.total} wallpaper${state.total === 1 ? '' : 's'} found` : 'No wallpapers found';
    if (reset) grid.innerHTML = '';
    if (!walls || !walls.length) {
      if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No wallpapers here yet.</div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }
    grid.insertAdjacentHTML('beforeend', walls.map(wallCardHTML).join(''));
    loadMoreBtn.style.display = (state.offset + walls.length) < state.total ? 'inline-flex' : 'none';
  } catch (e) {
    if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load wallpapers from the backend.</div>`;
  }
}

loadMoreBtn.addEventListener('click', () => { state.offset += state.limit; fetchWallpapers(false); });

document.getElementById('pageSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    state.q = e.target.value.trim();
    const url = new URL(location.href);
    if (state.q) url.searchParams.set('q', state.q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    fetchWallpapers(true);
  }
});

loadCategories();
fetchWallpapers(true);
