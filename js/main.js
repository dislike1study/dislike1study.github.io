/* ========================================
   Clean Theme - Main JavaScript
   Dark mode, TOC tracking, Search, Mobile menu
   ======================================== */

(function () {
  'use strict';

  // ---- Dark Mode Toggle ----
  var themeToggle = document.getElementById('theme-toggle');

  function getTheme() {
    return localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ---- TOC Active Tracking ----
  (function () {
    var tocLinks = document.querySelectorAll('.toc a');
    if (!tocLinks.length) return;

    var headings = [];
    for (var i = 0; i < tocLinks.length; i++) {
      var href = tocLinks[i].getAttribute('href');
      if (!href) continue;
      var id = decodeURIComponent(href.slice(1));
      var el = document.getElementById(id);
      if (el) headings.push({ el: el, link: tocLinks[i] });
    }

    if (!headings.length) return;

    function onScroll() {
      var scrollTop = window.scrollY + 100;
      var active = headings[0];
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].el.offsetTop <= scrollTop) {
          active = headings[i];
        }
      }
      for (var j = 0; j < tocLinks.length; j++) {
        tocLinks[j].classList.remove('active');
      }
      if (active) active.link.classList.add('active');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // ---- Client-Side Search ----
  (function () {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var openBtn = document.getElementById('search-toggle');
    var closeBtn = document.getElementById('search-close');

    if (!overlay || !input) return;

    var searchData = null;

    function loadSearchData(cb) {
      if (searchData) return cb(searchData);
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/search.xml', true);
      xhr.onload = function () {
        if (xhr.status !== 200) return;
        var xml = xhr.responseXML;
        if (!xml) return;
        var entries = xml.querySelectorAll('entry');
        searchData = [];
        for (var i = 0; i < entries.length; i++) {
          var titleEl = entries[i].querySelector('title');
          var urlEl = entries[i].querySelector('url');
          var contentEl = entries[i].querySelector('content');
          searchData.push({
            title: titleEl ? titleEl.textContent : '',
            url: urlEl ? urlEl.textContent.trim() : '',
            content: contentEl ? contentEl.textContent : ''
          });
        }
        cb(searchData);
      };
      xhr.send();
    }

    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function search(keyword) {
      if (!keyword.trim()) {
        results.innerHTML = '';
        return;
      }
      loadSearchData(function (data) {
        var kw = keyword.toLowerCase();
        var kwEscaped = escapeRegExp(kw);
        var re = new RegExp('(' + kwEscaped + ')', 'gi');

        var matches = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].title.toLowerCase().indexOf(kw) !== -1 ||
              data[i].content.toLowerCase().indexOf(kw) !== -1) {
            matches.push(data[i]);
          }
          if (matches.length >= 10) break;
        }

        if (!matches.length) {
          results.innerHTML = '<div class="search-no-result">没有找到相关文章</div>';
          return;
        }

        var html = '';
        for (var j = 0; j < matches.length; j++) {
          var item = matches[j];
          var title = escapeHtml(item.title).replace(re, '<mark>$1</mark>');

          var snippet = '';
          var idx = item.content.toLowerCase().indexOf(kw);
          if (idx !== -1) {
            var start = Math.max(0, idx - 40);
            var end = Math.min(item.content.length, idx + kw.length + 80);
            snippet = (start > 0 ? '...' : '') +
              escapeHtml(item.content.slice(start, end)).replace(re, '<mark>$1</mark>') +
              (end < item.content.length ? '...' : '');
          }

          html += '<a class="search-result-item" href="' + item.url + '">' +
            '<div class="search-result-title">' + title + '</div>' +
            (snippet ? '<div class="search-result-snippet">' + snippet + '</div>' : '') +
            '</a>';
        }
        results.innerHTML = html;
      });
    }

    function openSearch() {
      overlay.style.display = 'flex';
      input.value = '';
      results.innerHTML = '';
      setTimeout(function () { input.focus(); }, 50);
    }

    function closeSearch() {
      overlay.style.display = 'none';
    }

    if (openBtn) openBtn.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        closeSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (overlay.style.display === 'none' || overlay.style.display === '') {
          openSearch();
        } else {
          closeSearch();
        }
      }
    });

    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var val = this.value;
      debounceTimer = setTimeout(function () { search(val); }, 200);
    });
  })();

  // ---- Mobile Menu Toggle ----
  (function () {
    var menuBtn = document.getElementById('menu-toggle');
    var nav = document.getElementById('site-nav');
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
    });

    // Close menu when clicking a link
    var links = nav.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        nav.classList.remove('nav-open');
      });
    }
  })();

})();
