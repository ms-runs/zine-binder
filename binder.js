/* Zine binder: a 9-pocket binder sheet. Pick a zine and it slides out of its sleeve into a page-turning viewer.
   Data lives in zines.js. Panels run in reading order: front cover, pages 1-12, back cover (14 panels). */
(function(){
  'use strict';
  var root = document.getElementById('zb-app');
  var ZINES = window.ZINES || [];
  if(!root || !ZINES.length) return;

  var TOTAL = 12;      // zines planned for the year: sets how many pockets the binder shows
  var PER_SHEET = 6;   // two facing sheets of six
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function(){ return reduceQuery.matches; };
  var WORDS = ['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];

  var ICON = {
    close:'<svg class="zi" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev:'<svg class="zi" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>',
    next:'<svg class="zi" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>'
  };
  var RING = '<svg class="zb-ring" viewBox="0 0 92 18" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="3" width="88" height="12" rx="6" fill="none" stroke="url(#zb-metal)" stroke-width="3.2" vector-effect="non-scaling-stroke"/></svg>';
  var HOLES = [20, 50, 80];

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function label(z){ return z.title + ', ' + z.sub; }
  function wire(img){
    if(img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else img.addEventListener('load', function(){ img.classList.add('is-loaded'); }, {once:true});
  }

  /* ---------- Binder ---------- */
  var binder = document.getElementById('zb-binder');
  var spread = document.getElementById('zb-spread');
  var wide = window.matchMedia('(min-width:900px)'), mid = window.matchMedia('(min-width:560px)');
  function layoutMode(){ return wide.matches ? 'spread' : mid.matches ? 'sheet' : 'phone'; }
  document.getElementById('zb-lede').textContent =
    (WORDS[ZINES.length] || ZINES.length) + ' of ' + (WORDS[TOTAL] || TOTAL).toLowerCase() + ' so far. Each one is a single sheet of paper, folded into a small book. Pick one from the binder to flip through it.';

  function ringEl(extra){
    var d = document.createElement('span'); d.innerHTML = RING; var s = d.firstChild; if(extra) s.classList.add(extra); return s;
  }
  function slotEl(z){
    var li = document.createElement('div');
    if(z){
      li.className = 'zb-slot'; li.dataset.id = z.id;
      li.innerHTML = '<button type="button" class="zb-pocket" aria-label="Open ' + esc(label(z)) + '">' +
        '<span class="zb-sleeve"><span class="zb-card"><img src="' + esc(z.cover) + '" alt="' + esc(label(z)) + ' zine cover" loading="lazy" decoding="async"></span><span class="zb-front"></span></span></button>';
      wire(li.querySelector('img'));
      li.querySelector('button').addEventListener('click', function(){ openZine(z, li); });
    } else {
      li.className = 'zb-slot is-empty'; li.setAttribute('aria-hidden', 'true');
      li.innerHTML = '<div class="zb-sleeve"><span class="zb-card"></span><span class="zb-front"></span></div>';
    }
    return li;
  }
  function labelEl(z){
    var p = document.createElement('p'); p.className = 'zb-label';
    if(z) p.innerHTML = '<b>' + esc(z.title) + '</b><span>' + esc(z.sub) + '</span>';
    return p;
  }
  function render(){
    spread.innerHTML = '';
    var mode = layoutMode();
    var slots = Math.ceil(Math.max(TOTAL, ZINES.length) / PER_SHEET) * PER_SHEET;
    if(slots > PER_SHEET * 2 && window.console) console.warn('Binder shows twelve pockets; more zines need another binder page.');
    // spread: two facing sheets of 3x2 | sheet: one 4x3 sheet | phone: two stacked sheets of 2x3
    var perSheet = mode === 'sheet' ? slots : PER_SHEET;
    var perRow = mode === 'spread' ? 3 : mode === 'sheet' ? 4 : 2;
    var count = Math.min(2, slots / perSheet);
    for(var s = 0; s < count; s++){
      var sheet = document.createElement('div'); sheet.className = 'zb-sheet ' + ((mode === 'spread' && s === 0) ? 'l' : 'r');
      var margin = document.createElement('div'); margin.className = 'zb-margin';
      HOLES.forEach(function(p){ var h = document.createElement('span'); h.className = 'zb-hole'; h.style.top = 'calc(' + p + '% - 6px)'; margin.appendChild(h); });
      var pages = document.createElement('div'); pages.className = 'zb-pages';
      for(var r = 0; r < perSheet / perRow; r++){
        var plastic = document.createElement('div'); plastic.className = 'zb-plastic'; plastic.style.setProperty('--cols', perRow);
        var labels = document.createElement('div'); labels.className = 'zb-labels'; labels.style.setProperty('--cols', perRow);
        for(var c = 0; c < perRow; c++){
          var z = ZINES[s * perSheet + r * perRow + c];
          plastic.appendChild(slotEl(z)); labels.appendChild(labelEl(z));
        }
        pages.appendChild(plastic); pages.appendChild(labels);
      }
      sheet.appendChild(margin); sheet.appendChild(pages);
      HOLES.forEach(function(p){ var rr = ringEl('m'); rr.style.top = 'calc(' + p + '% - 8px)'; margin.appendChild(rr); });
      spread.appendChild(sheet);
      if(mode === 'spread' && s === 0){
        var spine = document.createElement('div'); spine.className = 'zb-spine';
        HOLES.forEach(function(p){ var rr = ringEl(); rr.style.top = 'calc(' + p + '% - 9px)'; spine.appendChild(rr); });
        spread.appendChild(spine);
      }
    }
    layoutGlare();
  }

  /* Each pocket's front sheet draws its slice of one binder-sized highlight, so the glare runs
     continuously across seams and sheets. */
  function layoutGlare(){
    var br = binder.getBoundingClientRect();
    binder.style.setProperty('--bw', br.width + 'px'); binder.style.setProperty('--bh', br.height + 'px');
    binder.querySelectorAll('.zb-front').forEach(function(f){
      var r = f.getBoundingClientRect();
      f.style.setProperty('--ox', (r.left - br.left) + 'px'); f.style.setProperty('--oy', (r.top - br.top) + 'px');
    });
  }
  if('ResizeObserver' in window) new ResizeObserver(function(){ layoutGlare(); }).observe(binder);
  window.addEventListener('resize', layoutGlare);
  var relayout = function(){ if(!V) render(); };
  wide.addEventListener('change', relayout); mid.addEventListener('change', relayout);

  /* On a mouse the light follows the pointer; on touch or reduced motion it stays put. */
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced()){
    var raf = 0, nx = 42;
    binder.addEventListener('pointermove', function(e){
      var r = binder.getBoundingClientRect();
      nx = 14 + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 62;
      if(!raf) raf = requestAnimationFrame(function(){ raf = 0; binder.style.setProperty('--gx', nx.toFixed(1) + '%'); });
    });
    binder.addEventListener('pointerleave', function(){ binder.style.setProperty('--gx', '42%'); });
  }
  var V = null; // active viewer state (declared here so render() can check it)
  render();

  /* ---------- Viewer ---------- */

  function pageSize(single){
    var vw = window.innerWidth, vh = window.innerHeight;
    var availH = Math.min(vh - 170, 840);
    var pw = single ? Math.min(vw - 40, availH * 2 / 3) : Math.min(availH * 2 / 3, (vw - 200) / 2);
    pw = Math.max(120, Math.floor(pw));
    return { pw: pw, ph: Math.round(pw * 1.5) };
  }
  function wantsSingle(){ return window.innerWidth < 820 || window.innerWidth / window.innerHeight < 1.0; }

  function buildBook(){
    var z = V.zine, single = V.single, n = z.panels.length;
    V.book.className = 'zv-book';
    var shift = V.shift; shift.innerHTML = '';
    V.root.classList.toggle('is-single', single);
    var s = pageSize(single);
    V.book.style.setProperty('--pw', s.pw + 'px'); V.book.style.setProperty('--ph', s.ph + 'px');
    V.N = single ? n : Math.ceil(n / 2);
    V.max = single ? V.N - 1 : V.N;
    V.leaves = [];
    var ul = document.createElement('span'); ul.className = 'zv-under l'; shift.appendChild(ul);
    var ur = document.createElement('span'); ur.className = 'zv-under r'; shift.appendChild(ur);
    for(var i = 0; i < V.N; i++){
      var leaf = document.createElement('div'); leaf.className = 'zv-leaf';
      var fi = single ? i : i * 2, bi = single ? -1 : i * 2 + 1;
      leaf.appendChild(face(z, fi, 'front'));
      if(bi >= 0 && bi < n) leaf.appendChild(face(z, bi, 'back'));
      shift.appendChild(leaf); V.leaves.push(leaf);
    }
    for(var k = 0; k < V.N; k++) setLeaf(k, k < V.pos, true);
    syncState();
  }
  function face(z, idx, side){
    var f = document.createElement('div'); f.className = 'zv-face ' + side;
    var img = new Image(); img.decoding = 'async'; img.draggable = false;
    img.alt = idx === 0 ? 'Front cover' : idx === z.panels.length - 1 ? 'Back cover' : 'Page ' + idx;
    img.src = z.panels[idx]; wire(img); f.appendChild(img);
    return f;
  }
  function setLeaf(i, flipped, instant){
    var l = V.leaves[i];
    l.style.setProperty('--tz', ((flipped ? i : V.N - i) * 0.5) + 'px');
    l.style.zIndex = flipped ? i : V.N - i;
    l.classList.toggle('is-flipped', flipped);
  }
  function syncState(){
    var b = V.book, N = V.N, pos = V.pos, last = V.zine.panels.length - 1;
    b.classList.toggle('at-start', pos === 0);
    b.classList.toggle('at-end', !V.single && pos === N);
    var text;
    if(V.single){
      text = pos === 0 ? 'Cover' : pos === last ? 'Back cover' : 'Page ' + pos + ' of ' + (last - 1);
    } else {
      text = pos === 0 ? 'Cover' : pos === N ? 'Back cover' : 'Pages ' + (2 * pos - 1) + '–' + (2 * pos);
    }
    V.posEl.textContent = text;
    V.prevBtn.disabled = pos === 0; V.nextBtn.disabled = pos === V.max;
  }
  function step(dir){
    if(!V || V.closing) return;
    if(dir > 0 && V.pos < V.max){
      var l = V.leaves[V.pos]; l.style.zIndex = 100; setLeaf(V.pos, true); V.pos++;
      settle(l, V.pos - 1, true);
    } else if(dir < 0 && V.pos > 0){
      V.pos--; var l2 = V.leaves[V.pos]; l2.style.zIndex = 100; setLeaf(V.pos, false);
      settle(l2, V.pos, false);
    } else return;
    syncState();
  }
  function settle(leaf, i, flipped){
    var done = function(){ leaf.style.zIndex = flipped ? i : V.N - i; };
    if(reduced()) done(); else setTimeout(done, 700);
  }
  function goTo(target, stagger){
    if(!V) return;
    var steps = Math.abs(target - V.pos), dir = target > V.pos ? 1 : -1;
    for(var i = 0; i < steps; i++) setTimeout(function(){ step(dir); }, i * stagger);
  }

  function rectCenter(r){ return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function flyTransform(fromRect, toRect){
    var a = rectCenter(fromRect), b = rectCenter(toRect);
    return 'translate(' + (a.x - b.x) + 'px,' + (a.y - b.y) + 'px) scale(' + (fromRect.width / toRect.width) + ')';
  }

  function openZine(zine, slot){
    if(V) return;
    var cardEl = slot.querySelector('.zb-card');
    slot.classList.add('is-pulled');
    var wait = reduced() ? 0 : 300;
    setTimeout(function(){
      var from = cardEl.getBoundingClientRect();
      var single = wantsSingle();
      var node = document.createElement('div');
      node.className = 'zv'; node.setAttribute('role', 'dialog'); node.setAttribute('aria-modal', 'true'); node.setAttribute('aria-label', label(zine) + ' zine');
      node.innerHTML =
        '<div class="zv-veil"></div>' +
        '<header class="zv-top"><p class="zv-title">' + esc(zine.title) + '<span>' + esc(zine.sub) + '</span></p>' +
          '<button type="button" class="zb-btn zv-close">' + ICON.close + 'Close</button></header>' +
        '<div class="zv-stage"><div class="zv-fly"><div class="zv-book"><div class="zv-shift"></div></div></div></div>' +
        '<footer class="zv-bar"><button type="button" class="zb-btn zv-prev" aria-label="Previous page">' + ICON.prev + '</button>' +
          '<p class="zv-pos" aria-live="polite"></p>' +
          '<button type="button" class="zb-btn zv-next" aria-label="Next page">' + ICON.next + '</button></footer>';
      root.appendChild(node);
      V = { zine: zine, slot: slot, card: cardEl, opener: slot.querySelector('button'), root: node, pos: 0, single: single,
            book: node.querySelector('.zv-book'), shift: node.querySelector('.zv-shift'), fly: node.querySelector('.zv-fly'),
            posEl: node.querySelector('.zv-pos'), prevBtn: node.querySelector('.zv-prev'), nextBtn: node.querySelector('.zv-next'), closing: false };
      document.documentElement.style.overflow = 'hidden';
      buildBook();
      history.replaceState(null, '', '#' + zine.id);

      slot.classList.add('is-out');
      var veil = node.querySelector('.zv-veil'), chrome = [node.querySelector('.zv-top'), node.querySelector('.zv-bar')];
      if(!reduced()){
        var to = V.fly.getBoundingClientRect();
        // At the cover state the cover is centred, so the fly box's right half is the cover.
        var coverRect = { left: to.left + to.width / 2 - to.width / 4, top: to.top, width: to.width / 2, height: to.height };
        if(single) coverRect = to;
        V.fly.animate([{ transform: flyTransform(from, coverRect) }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
        veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
        chrome.forEach(function(c){ c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 220, easing: 'ease-out', fill: 'backwards' }); });
      }
      V.nextBtn.focus();
      bindViewer(node);
    }, wait);
  }

  function bindViewer(node){
    V.prevBtn.addEventListener('click', function(){ step(-1); });
    V.nextBtn.addEventListener('click', function(){ step(1); });
    node.querySelector('.zv-close').addEventListener('click', closeZine);
    var sx = 0, sy = 0, down = false;
    node.addEventListener('pointerdown', function(e){ if(e.target.closest('button')) return; down = true; sx = e.clientX; sy = e.clientY; });
    node.addEventListener('pointerup', function(e){
      if(!down) return; down = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4){ step(dx < 0 ? 1 : -1); return; }
      if(Math.abs(dx) < 8 && Math.abs(dy) < 8){
        var f = e.target.closest('.zv-face');
        if(f){
          if(V.single){ var r = f.getBoundingClientRect(); step(e.clientX - r.left < r.width * .35 ? -1 : 1); }
          else step(f.classList.contains('back') ? -1 : 1);
        } else if(e.target.closest('.zv-stage, .zv-veil') && !e.target.closest('.zv-book')) closeZine();
      }
    });
    V.onKey = function(e){
      if(!V) return;
      if(e.key === 'Escape'){ e.preventDefault(); closeZine(); }
      else if(e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); step(1); }
      else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); step(-1); }
      else if(e.key === 'Home'){ e.preventDefault(); goTo(0, 55); }
      else if(e.key === 'End'){ e.preventDefault(); goTo(V.max, 55); }
      else if(e.key === 'Tab'){
        var f = Array.prototype.filter.call(V.root.querySelectorAll('button'), function(b){ return !b.disabled; });
        if(!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        else if(!V.root.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', V.onKey);
    V.onResize = function(){
      clearTimeout(V.rt);
      V.rt = setTimeout(function(){
        var single = wantsSingle(), last = V.zine.panels.length - 1, idx;
        if(single === V.single){ var s = pageSize(single); V.book.style.setProperty('--pw', s.pw + 'px'); V.book.style.setProperty('--ph', s.ph + 'px'); return; }
        idx = V.single ? V.pos : (V.pos === 0 ? 0 : V.pos === V.N ? last : 2 * V.pos - 1);
        V.single = single;
        V.pos = single ? idx : (idx === 0 ? 0 : idx === last ? Math.ceil((last + 1) / 2) : Math.ceil(idx / 2));
        buildBook();
      }, 150);
    };
    window.addEventListener('resize', V.onResize);
  }

  function closeZine(){
    if(!V || V.closing) return;
    V.closing = true;
    var v = V, quick = reduced();
    var rewind = v.pos > 0 && !quick;
    if(rewind){
      for(var i = v.pos - 1, d = 0; i >= 0; i--, d += 45){
        (function(idx, ms){ setTimeout(function(){
          var l = v.leaves[idx]; l.style.zIndex = 100; setLeaf(idx, false);
          setTimeout(function(){ l.style.zIndex = v.N - idx; }, 700);
        }, ms); })(i, d);
      }
      v.pos = 0; syncState();
    }
    var wait = rewind ? 45 * 6 + 520 : 0;
    setTimeout(function(){
      var finish = function(){
        document.removeEventListener('keydown', v.onKey); window.removeEventListener('resize', v.onResize);
        v.root.remove(); document.documentElement.style.overflow = '';
        v.slot.classList.remove('is-out');
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ v.slot.classList.remove('is-pulled'); }); });
        history.replaceState(null, '', location.pathname + location.search);
        V = null;
        v.opener.focus({ preventScroll: true });
      };
      if(quick){ finish(); return; }
      v.slot.classList.add('is-pulled');
      var target = v.card.getBoundingClientRect();
      var to = v.fly.getBoundingClientRect();
      var cover = v.single ? to : { left: to.left + to.width / 4, top: to.top, width: to.width / 2, height: to.height };
      v.root.querySelectorAll('.zv-top, .zv-bar').forEach(function(c){ c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }); });
      v.root.querySelector('.zv-veil').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 100, easing: 'ease-out', fill: 'forwards' });
      var a = v.fly.animate([{ transform: 'none' }, { transform: flyTransform(target, cover) }], { duration: 440, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      a.onfinish = finish;
    }, wait);
  }

  /* Deep link: index.html#sevilla-october opens that zine. */
  var hash = decodeURIComponent((location.hash || '').slice(1));
  if(hash){
    var at = -1; ZINES.forEach(function(z, i){ if(z.id === hash) at = i; });
    var slot = spread.querySelector('[data-id="' + hash + '"]');
    if(at >= 0 && slot) setTimeout(function(){ openZine(ZINES[at], slot); }, 200);
  }
})();
