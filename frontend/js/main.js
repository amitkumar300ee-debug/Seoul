// ===== Shared helpers used across all pages =====

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', 'X-App-Key': APP_KEY, ...(opts.headers || {}) },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

// Newsletter (front-end only placeholder - wire to a real list provider later)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('newsBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const email = document.getElementById('newsEmail').value.trim();
      if (!email || !email.includes('@')) { showToast('Enter a valid email'); return; }
      document.getElementById('newsEmail').value = '';
      showToast('Subscribed! 🎉');
    });
  }

  // Nav search -> jumps to wallpapers page with the query
  const navSearch = document.getElementById('navSearch');
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && navSearch.value.trim()) {
        window.location.href = `wallpapers.html?q=${encodeURIComponent(navSearch.value.trim())}`;
      }
    });
  }
});

// wallpaper row shape (from /api/walls): { id, title, category, image_url, thumb_url, likes, views, is_ai, created_at }
function wallCardHTML(w) {
  const img = w.thumb_url || w.image_url;
  return `
    <a class="wall-card" href="wallpaper.html?id=${w.id}">
      <img src="${img}" alt="${escapeHTML(w.title)}" loading="lazy" />
      <div class="overlay"><span>${escapeHTML(w.title)}</span></div>
    </a>`;
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
