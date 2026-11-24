(function () {
  const DATA_URL = 'data/news.json';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dateText = (value) => {
    if (!value) return '';
    const date = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }).format(date);
  };
  const safeUrl = (value) => {
    const url = String(value || '').trim();
    if (/^(https?:|mailto:|tel:|\/|\.\.?\/|#)/i.test(url) && !/^\/\//.test(url)) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return '#';
  };
  const inlineMarkdown = (text) => {
    let value = escapeHtml(text);
    // Inline code first, protected from subsequent emphasis substitutions.
    const code = [];
    value = value.replace(/`([^`]+)`/g, (_, content) => { code.push(`<code>${content}</code>`); return `\u0000CODE${code.length-1}\u0000`; });
    value = value.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => `<img src="${escapeHtml(safeUrl(url))}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`);
    value = value.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, label, url, title) => `<a href="${escapeHtml(safeUrl(url))}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}${title ? ` title="${title}"` : ''}>${label}</a>`);
    value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
    value = value.replace(/~~(.+?)~~/g, '<del>$1</del>');
    value = value.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
    value = value.replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)] || '');
    return value;
  };
  const renderMarkdown = (source) => {
    const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let paragraph = [], listType = null, quote = [], codeLines = [], inCode = false;
    const flushParagraph = () => { if (paragraph.length) { out.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`); paragraph = []; } };
    const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
    const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`); quote = []; } };
    const isSpecial = (line) => /^\s*(#{1,6}\s|>\s?|[-*+]\s+|\d+[.)]\s+|```|---+\s*$|___+\s*$|\*\*\*+\s*$|!\[|\|)/.test(line);
    for (let i=0; i<lines.length; i++) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        flushParagraph(); closeList(); flushQuote();
        if (inCode) { out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`); codeLines=[]; inCode=false; }
        else inCode=true;
        continue;
      }
      if (inCode) { codeLines.push(line); continue; }
      if (!line.trim()) { flushParagraph(); closeList(); flushQuote(); continue; }
      const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
      if (heading) { flushParagraph(); closeList(); flushQuote(); const level=Math.min(heading[1].length,4); out.push(`<h${level+1}>${inlineMarkdown(heading[2].replace(/\s+#+\s*$/, ''))}</h${level+1}>`); continue; }
      if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) { flushParagraph(); closeList(); flushQuote(); out.push('<hr>'); continue; }
      if (/^\s*>/.test(line)) { flushParagraph(); closeList(); quote.push(line.replace(/^\s*> ?/, '')); continue; }
      if (quote.length) flushQuote();
      const ul=line.match(/^\s*[-*+]\s+(.+)$/), ol=line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (ul || ol) { flushParagraph(); const type=ul?'ul':'ol'; if (listType!==type) { closeList(); out.push(`<${type}>`); listType=type; } out.push(`<li>${inlineMarkdown((ul||ol)[1])}</li>`); continue; }
      // Simple Markdown table support.
      if (/^\s*\|/.test(line) && i+1<lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])) {
        flushParagraph(); closeList(); flushQuote();
        const cells = (v) => v.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
        const heads=cells(line); i++;
        const rows=[]; while(i+1<lines.length && /^\s*\|/.test(lines[i+1])) rows.push(cells(lines[++i]));
        out.push(`<div class="article-table-wrap"><table><thead><tr>${heads.map(c=>`<th>${inlineMarkdown(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${heads.map((_,j)=>`<td>${inlineMarkdown(r[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
      }
      if (isSpecial(line)) { flushParagraph(); closeList(); }
      else if (listType) closeList();
      paragraph.push(line);
    }
    if (inCode) out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    flushParagraph(); closeList(); flushQuote();
    return out.join('\n');
  };
  const card = (post, preview) => {
    const href = `article.html?slug=${encodeURIComponent(post.slug || '')}`;
    const image = post.image || 'images/vuon-ca-phe-eakiet.jpg';
    const cls = preview ? 'news-preview' : 'news-list';
    const publishedDate = dateText(post.date);
    return `<article class="${cls}-card">
      <a class="${cls}-image" href="${href}"><img src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title)}" loading="lazy"></a>
      <div class="${cls}-copy">
        <span class="news-category">${escapeHtml(post.category || 'Tin tức')}</span>
        <time class="news-card-date"${publishedDate ? ` datetime="${escapeHtml(post.date)}"` : ''}>${publishedDate ? escapeHtml(publishedDate) : 'Ngày đăng đang cập nhật'}</time>
        <h3><a href="${href}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <a class="news-read-more" href="${href}">Đọc bài viết →</a>
      </div>
    </article>`;
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
        const related = posts.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 3);
        const relatedHtml = related.length ? `<section class="article-related" aria-labelledby="article-related-title"><div class="article-related-heading"><span class="article-related-kicker">KHÁM PHÁ THÊM</span><h2 id="article-related-title">Bài viết liên quan</h2></div><div class="news-preview-grid">${related.map(p => card(p, true)).join('')}</div></section>` : '';
        detail.innerHTML = `<div class="container article-wrap">
          <div class="breadcrumb"><a href="index.html">Trang chủ</a> / <a href="news.html">Tin tức</a> / ${escapeHtml(post.category || '')}</div>
          <article class="article-content">
            <span class="news-category">${escapeHtml(post.category || 'Tin tức')}</span>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="article-meta">${dateText(post.date) || 'Ngày đăng đang cập nhật'}</div>
            ${post.excerpt ? `<p class="article-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
            <img class="article-cover" src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title)}">
            <div class="article-body">${renderMarkdown(post.body)}</div>
            <div class="article-endmark"><span class="article-endmark-line"></span><strong>EA KIET Coffee</strong><p>Kết nối người nông dân, phát triển vùng nguyên liệu và lan tỏa giá trị cà phê bền vững.</p></div>
            <div class="article-actions"><a class="article-back-link" href="news.html">← Quay lại Tin tức</a></div>
          </article>
          ${relatedHtml}
        </div>`;
      }
    }
  }).catch(() => {
    document.querySelectorAll('[data-news-list]').forEach(el => el.innerHTML = '<p class="news-empty">Chưa tải được dữ liệu tin tức. Vui lòng thử lại sau.</p>');
    const detail = document.querySelector('[data-news-detail]'); if (detail) detail.innerHTML = '<div class="container"><h1>Không tải được bài viết</h1><a href="news.html">Quay lại Tin tức</a></div>';
  });
})();
