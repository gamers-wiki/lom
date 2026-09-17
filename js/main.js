/* =========================================================
   聖剣伝説 Legend of Mana 攻略Wiki  共通スクリプト
   ========================================================= */
(function () {
  'use strict';

  /* ---------- スマホ用ナビ開閉 ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('global-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
  }

  /* ---------- トップへ戻るボタン ---------- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScroll = function () {
      if (window.scrollY > 300) {
        toTop.classList.add('show');
      } else {
        toTop.classList.remove('show');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 解説一覧のタグ絞り込み ----------
     .tag-filter 内の button[data-tag] と、
     .column-item[data-tags="kaisetsu sekaikan ..."] を対応させる。
     URL に #tag-xxx が付いていれば、その絞り込みで開く。 */
  var filter = document.querySelector('.tag-filter');
  if (filter) {
    var buttons = filter.querySelectorAll('button[data-tag]');
    var items = document.querySelectorAll('.column-item');
    var empty = document.querySelector('.column-empty');

    var applyFilter = function (tag) {
      var shown = 0;
      buttons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tag') === tag);
      });
      items.forEach(function (item) {
        var tags = (item.getAttribute('data-tags') || '').split(/\s+/);
        var hit = tag === 'all' || tags.indexOf(tag) !== -1;
        item.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    };

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var tag = b.getAttribute('data-tag');
        applyFilter(tag);
        if (history.replaceState) {
          history.replaceState(null, '', tag === 'all' ? location.pathname : '#tag-' + tag);
        }
      });
    });

    var m = location.hash.match(/^#tag-([\w-]+)$/);
    applyFilter(m ? m[1] : 'all');
    window.addEventListener('hashchange', function () {
      var mm = location.hash.match(/^#tag-([\w-]+)$/);
      applyFilter(mm ? mm[1] : 'all');
    });
  }

  /* ---------- 目次の自動生成 ----------
     記事ページで <div class="toc" data-auto-toc></div> を置くと、
     .content 内の h2 / h3 から目次を生成する。 */
  var toc = document.querySelector('.toc[data-auto-toc]');
  var content = document.querySelector('.content');
  if (toc && content) {
    var headings = content.querySelectorAll('h2, h3');
    var rootList = document.createElement('ol');
    var currentH2Item = null;
    var subList = null;
    var count = 0;

    headings.forEach(function (h, i) {
      if (h.closest('.related') || h.closest('.toc') || h.closest('.p-box')) return;
      if (!h.id) h.id = 'section-' + (i + 1);
      count++;

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      var clone = h.cloneNode(true);
      clone.querySelectorAll('.name-en, .tag').forEach(function (el) { el.remove(); });
      a.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
      li.appendChild(a);

      if (h.tagName === 'H2') {
        rootList.appendChild(li);
        currentH2Item = li;
        subList = null;
      } else if (currentH2Item) {
        if (!subList) {
          subList = document.createElement('ol');
          currentH2Item.appendChild(subList);
        }
        subList.appendChild(li);
      } else {
        rootList.appendChild(li);
      }
    });

    if (count) {
      var title = document.createElement('div');
      title.className = 'toc-title';
      title.textContent = '目次';
      toc.appendChild(title);
      toc.appendChild(rootList);
    }
  }
})();
