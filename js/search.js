/* =========================================================
   サイト内検索（クライアント側）
   ビルド時に作った search-index.json を読み、部分一致で探す。
   サーバーが無い（GitHub Pages）ので、検索語はどこにも送られない。
   ========================================================= */
(function () {
  'use strict';

  var root = document.querySelector('[data-search-root]');
  if (!root) return;

  var indexUrl = root.getAttribute('data-index');
  var input = root.querySelector('input[name="q"]');
  var status = root.querySelector('.search-status');
  var list = root.querySelector('.search-results');
  var heading = document.querySelector('[data-search-heading]');
  var countEl = document.querySelector('[data-search-count]');

  var params = new URLSearchParams(location.search);
  var q = (params.get('q') || '').trim().slice(0, 100);
  if (input) input.value = q;

  var words = q.split(/[\s　]+/).filter(function (w) { return w !== ''; });

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var escRe = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

  var setStatus = function (text) { if (status) status.textContent = text; };

  if (!words.length) {
    setStatus('キーワードを入力してください。スペース区切りで AND 検索になります。');
    return;
  }
  if (heading) heading.textContent = '「' + q + '」の検索結果';
  document.title = '「' + q + '」の検索結果 - ' + document.title.replace(/^.*? - /, '');
  setStatus('検索中…');

  var lower = words.map(function (w) { return w.toLowerCase(); });

  var snippet = function (text) {
    var t = text || '';
    var lt = t.toLowerCase();
    var pos = -1;
    lower.forEach(function (w) {
      var p = lt.indexOf(w);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    });
    var start = Math.max(0, (pos === -1 ? 0 : pos) - 30);
    var frag = t.substr(start, 110);
    var out = esc(frag);
    words.forEach(function (w) {
      out = out.replace(new RegExp(escRe(esc(w)), 'gi'), function (m) { return '<mark>' + m + '</mark>'; });
    });
    return (start > 0 ? '…' : '') + out + (t.length > start + 110 ? '…' : '');
  };

  fetch(indexUrl, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (pages) {
      var results = [];
      pages.forEach(function (p) {
        var title = (p.t || '').toLowerCase();
        var hay = (p.t + ' ' + p.d + ' ' + (p.h || []).join(' ') + ' ' + p.x).toLowerCase();
        var score = 0;
        for (var i = 0; i < lower.length; i++) {
          var w = lower[i];
          var c = hay.split(w).length - 1;
          if (c === 0) { score = 0; break; }
          score += c + (title.indexOf(w) !== -1 ? 10 : 0);
        }
        if (score > 0) results.push({ p: p, score: score });
      });
      results.sort(function (a, b) { return b.score - a.score; });

      if (countEl) countEl.textContent = results.length + ' 件';
      if (!results.length) {
        setStatus('該当するページはありませんでした。別のキーワードでお試しください。');
        return;
      }
      setStatus('');
      var html = '';
      results.forEach(function (r) {
        var p = r.p;
        var body = (p.h && p.h.length ? p.h.join(' ／ ') + ' — ' : '') + (p.d || '') + ' ' + (p.x || '');
        html += '<li><a href="' + esc(p.u) + '" class="search-title">' + esc(p.t) + '</a>'
              + '<span class="search-url">' + esc(location.origin + p.u) + '</span>'
              + '<p>' + snippet(body) + '</p></li>';
      });
      if (list) list.innerHTML = html;
    })
    .catch(function (e) {
      setStatus('検索用のデータを読み込めませんでした（' + e.message + '）。');
    });
})();
