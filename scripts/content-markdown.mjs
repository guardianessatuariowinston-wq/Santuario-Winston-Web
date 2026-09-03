function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripUnsafeRawHtml(value) {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<[^>]+>/g, '');
}

function inline(value) {
  let text = escapeHtml(value);
  text = text.replace(/\[([^\]]{1,200})\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`);
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return text;
}

export function renderMarkdown(markdown) {
  const safe = stripUnsafeRawHtml(markdown).replace(/\r\n?/g, '\n');
  const lines = safe.split('\n');
  const out = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    out.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    if (line.startsWith('### ')) { flushParagraph(); flushList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { flushParagraph(); flushList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (/^[-*]\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^[-*]\s+/, '')); continue; }
    if (line.startsWith('> ')) { flushParagraph(); flushList(); out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`); continue; }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return out.join('\n');
}
