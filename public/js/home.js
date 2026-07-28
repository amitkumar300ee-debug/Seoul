document.addEventListener('DOMContentLoaded', async () => {
  // ---- Categories (with a sample thumbnail per category) ----
  try {
    const { categories } = await api('/api/categories'); // [{ category, c }]
    const grid = document.getElementById('catGrid');
    if (!categories || !categories.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No categories yet - upload wallpapers from the admin panel.</div>`;
    } else {
      const top = categories.slice(0, 7);
      // fetch one sample wallpaper per category for the thumbnail
      const samples = await Promise.all(top.map((c) =>
        api(`/api/walls?cat=${encodeURIComponent(c.category)}&limit=1`).catch(() => ({ walls: [] }))
      ));
      grid.innerHTML = top.map((c, i) => {
        const sample = samples[i].walls && samples[i].walls[0];
        const thumb = sample ? (sample.thumb_url || sample.image_url) : '';
        return `
        <a class="cat-card" href="wallpapers.html?category=${encodeURIComponent(c.category)}">
          <div class="cat-thumb">
            ${thumb ? `<img src="${thumb}" alt="${escapeHTML(c.category)}" loading="lazy" />` : ''}
            <div class="cat-badge">▤</div>
          </div>
          <div class="cat-info"><b>${escapeHTML(c.category)}</b><span>${c.c.toLocaleString()}+</span></div>
        </a>`;
      }).join('');
    }
  } catch (e) {
    document.getElementById('catGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load categories from the backend.</div>`;
  }

  // ---- Featured wallpapers (most popular) ----
  try {
    const { walls, total } = await api('/api/walls?limit=6&tab=popular');
    const grid = document.getElementById('featuredGrid');
    document.getElementById('statWallpapers').textContent = total ? `${total}+` : '0';
    if (!walls || !walls.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No wallpapers yet - upload some from the admin panel.</div>`;
    } else {
      grid.innerHTML = walls.map(wallCardHTML).join('');
      // fill hero device mockups with the first few real thumbnails
      const tablet = document.getElementById('heroGridTablet');
      const phone = document.getElementById('heroGridPhone');
      const src = (w) => w.thumb_url || w.image_url;
      if (tablet) tablet.innerHTML = walls.slice(0, 6).map((w) => `<div><img src="${src(w)}" loading="lazy"/></div>`).join('');
      if (phone) phone.innerHTML = walls.slice(0, 4).map((w) => `<div><img src="${src(w)}" loading="lazy"/></div>`).join('');
    }
  } catch (e) {
    document.getElementById('featuredGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>Couldn't load wallpapers from the backend.</div>`;
  }
});
