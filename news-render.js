(function () {
  const DATA_URL = 'data/news.json';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dateText = (value) => {
    if (!value) return '';
    const date = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }).format(date);
  };
  const paragraphs = (text) => String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  const card = (post, preview) => {
    const href = `article.html?slug=${encodeURIComponent(post.slug || '')}`;
    const image = post.image || 'images/vuon-ca-phe-eakiet.jpg';
    const cls = preview ? 'news-preview' : 'news-list';
    return `<article class="${cls}-card"><a class="${cls}-image" href="${href}"><img src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title)}" loading="lazy"></a><div class="${cls}-copy"><span class="news-category">${escapeHtml(post.category || 'Tin tức')}</span><h3><a href="${href}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt || '')}</p><a class="news-read-more" href="${href}">Đọc bài viết →</a></div></article>`;
  };
  fetch(DATA_URL).then(r => { if (!r.ok) throw new Error('Không tải được dữ liệu tin tức'); return r.json(); }).then(data => {
    const posts = (data.posts || []).filter(p => p.published !== false).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    document.querySelectorAll('[data-news-list]').forEach(el => {
      const category = el.dataset.category;
      const items = category ? posts.filter(p => p.category === category) : posts;
      const limit = el.dataset.newsList === 'preview' ? 3 : items.length;
      el.innerHTML = items.slice(0, limit).length ? items.slice(0, limit).map(p => card(p, el.dataset.newsList === 'preview')).join('') : '<p class="news-empty">Chưa có bài viết trong chuyên mục này.</p>';
    });
    document.querySelectorAll('[data-news-filter]').forEach(link => link.addEventListener('click', (event) => {
      event.preventDefault();
      const category = link.dataset.newsFilter;
      const list = document.querySelector('[data-news-list="all"]');
      if (!list) return;
      const items = category === 'all' ? posts : posts.filter(p => p.category === category);
      list.innerHTML = items.length ? items.map(p => card(p, false)).join('') : '<p class="news-empty">Chưa có bài viết trong chuyên mục này.</p>';
      document.querySelectorAll('[data-news-filter]').forEach(item => item.classList.toggle('active', item === link));
    }));
    const detail = document.querySelector('[data-news-detail]');
    if (detail) {
      const slug = new URLSearchParams(location.search).get('slug');
      const post = posts.find(p => p.slug === slug);
      if (!post) {
        detail.innerHTML = '<div class="container"><h1>Không tìm thấy bài viết</h1><p>Bài viết có thể đã được chuyển hoặc chưa xuất bản.</p><a class="btn-primary" href="news.html">Quay lại Tin tức</a></div>';
      } else {
        document.title = `${post.title} | EA KIET Coffee`;
        const meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = post.excerpt || post.title;
        const image = post.image || 'images/vuon-ca-phe-eakiet.jpg';
        detail.innerHTML = `<div class="container article-wrap"><div class="breadcrumb"><a href="index.html">Trang chủ</a> / <a href="news.html">Tin tức</a> / ${escapeHtml(post.category || '')}</div><article class="article-content"><span class="news-category">${escapeHtml(post.category || 'Tin tức')}</span><h1>${escapeHtml(post.title)}</h1><div class="article-meta">${dateText(post.date)}</div><img class="article-cover" src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title)}"><div class="article-body">${paragraphs(post.body)}</div><a class="news-read-more" href="news.html">← Quay lại Tin tức</a></article></div>`;
      }
    }
  }).catch(() => {
    document.querySelectorAll('[data-news-list]').forEach(el => el.innerHTML = '<p class="news-empty">Chưa tải được dữ liệu tin tức. Vui lòng thử lại sau.</p>');
    const detail = document.querySelector('[data-news-detail]'); if (detail) detail.innerHTML = '<div class="container"><h1>Không tải được bài viết</h1><a href="news.html">Quay lại Tin tức</a></div>';
  });
})();
