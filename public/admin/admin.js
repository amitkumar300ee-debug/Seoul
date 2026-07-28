let selectedFile = null;

async function requireAuth() {
  try {
    await api('/api/admin/wallpapers');
  } catch (e) {
    window.location.href = 'login.html';
  }
}

async function loadTable() {
  const body = document.getElementById('tableBody');
  try {
    const { wallpapers } = await api('/api/admin/wallpapers');
    document.getElementById('countLabel').textContent = wallpapers.length;
    // populate category suggestions
    const cats = [...new Set(wallpapers.map((w) => w.category))];
    document.getElementById('catList').innerHTML = cats.map((c) => `<option value="${escapeHTML(c)}">`).join('');

    if (!wallpapers.length) {
      body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--txt-faint); padding:30px;">No wallpapers yet. Upload your first one above.</td></tr>`;
      return;
    }
    body.innerHTML = wallpapers.map((w) => `
      <tr data-id="${w.id}">
        <td><img class="thumb" src="${API_BASE}/image/${w.image_key}" /></td>
        <td>${escapeHTML(w.title)}</td>
        <td><span class="pill">${escapeHTML(w.category)}</span></td>
        <td>${w.likes || 0}</td>
        <td>${w.downloads || 0}</td>
        <td>${(w.created_at || '').slice(0, 10)}</td>
        <td><button class="icon-btn delete-btn" title="Delete">🗑</button></td>
      </tr>`).join('');

    body.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const row = e.target.closest('tr');
        const id = row.dataset.id;
        if (!confirm('Delete this wallpaper? This cannot be undone.')) return;
        try {
          await api(`/api/admin/wallpapers/${id}`, { method: 'DELETE' });
          row.remove();
          showToast('Wallpaper deleted');
        } catch (err) { showToast(err.message); }
      });
    });
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--txt-faint); padding:30px;">Couldn't load wallpapers.</td></tr>`;
  }
}

function handleImagePick(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const zone = document.getElementById('dropZone');
  zone.classList.add('has-image');
  zone.innerHTML = `<img src="${URL.createObjectURL(file)}" /><input type="file" id="imageInput" accept="image/*" />`;
  document.getElementById('imageInput').addEventListener('change', handleImagePick);
}
document.getElementById('imageInput').addEventListener('change', handleImagePick);

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('uploadErr');
  const btn = document.getElementById('uploadBtn');
  errEl.textContent = '';
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value.trim();
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];
  if (!file) { errEl.textContent = 'Please choose an image'; return; }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('category', category);
  fd.append('image', file);

  btn.disabled = true;
  btn.textContent = 'Uploading…';
  try {
    const res = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Upload failed');
    }
    showToast('Wallpaper uploaded ✅');
    document.getElementById('uploadForm').reset();
    document.getElementById('dropZone').classList.remove('has-image');
    document.getElementById('dropZone').innerHTML = `<span>Click or drop image<br />(portrait, 9:16 ideal)</span><input type="file" id="imageInput" accept="image/*" required />`;
    document.getElementById('imageInput').addEventListener('change', handleImagePick);
    selectedFile = null;
    loadTable();
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Wallpaper';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  try { await api('/api/admin/logout', { method: 'POST' }); } catch (_) {}
  window.location.href = 'login.html';
});

requireAuth();
loadTable();
