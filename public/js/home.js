document.addEventListener('DOMContentLoaded', async () => {
  // ---- Categories ----
  try {
    const { categories } = await api('/api/categories');
    const grid = document.getElementById('catGrid');
    if (!categories || !categories.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No categories yet — upload wallpapers from the admin panel.</div>`;
    } else {
      grid.innerHTML = categories.slice(0, 7).map((c) => `
        <a class="cat-card" href="wallpapers.html?category=${encodeURIComponent(c.category)}">
          <div class="cat-thumb">
            <img src="${API_BASE}/image/${c.sample_key}" alt="${escapeHTML(c.category)}" loading="lazy" />
            <div class="cat-badge">▤</div>
          </div>
          <div class="cat-info"><b>${escapeHTML(c.category)}</b><span>${c.count.toLocaleString()}+</span></div>
        </a>`).join('');
    }
  } catch (e) {
    document.getElementById('catGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load categories. Is the backend URL set in js/config.js?</div>`;
  }

  // ---- Featured wallpapers ----
  try {
    const { wallpapers, total } = await api('/api/wallpapers?limit=6&sort=popular');
    const grid = document.getElementById('featuredGrid');
    document.getElementById('statWallpapers').textContent = total ? `${total}+` : '0';
    if (!wallpapers || !wallpapers.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No wallpapers yet — upload some from the admin panel.</div>`;
    } else {
      grid.innerHTML = wallpapers.map(wallCardHTML).join('');
      // fill hero device mockups with the first few real thumbnails
      const tablet = document.getElementById('heroGridTablet');
      const phone = document.getElementById('heroGridPhone');
      if (tablet) tablet.innerHTML = wallpapers.slice(0, 6).map((w) => `<div><img src="${API_BASE}/image/${w.image_key}" loading="lazy"/></div>`).join('');
      if (phone) phone.innerHTML = wallpapers.slice(0, 4).map((w) => `<div><img src="${API_BASE}/image/${w.image_key}" loading="lazy"/></div>`).join('');
    }
  } catch (e) {
    document.getElementById('featuredGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load wallpapers. Is the backend URL set in js/config.js?</div>`;
  }
});
