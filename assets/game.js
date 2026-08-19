/* Build the Grid ------------------------------------------------------------
   Pick a mix, and it clears every hour of one day, cheapest first.

   The numbers come from a capacity-planning workbook, Zone 1: the hourly
   demand shape, the solar and wind capacity factors, and the capital and fuel
   costs. Every fuel has one quirk that makes it behave like the real thing:

     solar    free, and gone by six
     wind     free, blows hardest while everyone is asleep
     battery  four hours deep, moves energy but never makes it
     coal     cheap to run and CANNOT TURN DOWN below 45%
     gas      any output, any second, brutal fuel bill

   Coal's floor is the interesting one. Build coal and solar together and the
   coal has nowhere to go at midday, so your free energy gets thrown away.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var DEMAND = [25000, 23752, 21858, 20538, 20314, 21611, 24820, 27680,
                29200, 29084, 28337, 27296, 26680, 26178, 25986, 26210,
                27482, 30719, 32071, 30898, 29876, 28454, 27467, 26432];

  var CF_SOLAR = [0, 0, 0, 0, 0, 0, 0.04, 0.25, 0.51, 0.54, 0.56, 0.55,
                  0.56, 0.58, 0.59, 0.60, 0.53, 0.22, 0.02, 0, 0, 0, 0, 0];
  var CF_WIND  = [0.39, 0.36, 0.33, 0.30, 0.28, 0.27, 0.23, 0.20, 0.17, 0.14,
                  0.13, 0.13, 0.13, 0.14, 0.15, 0.17, 0.20, 0.25, 0.34, 0.43,
                  0.47, 0.49, 0.46, 0.43];

  var BATT_HOURS = 4;
  var COAL_FLOOR = 0.45;
  var MAX_GW = 40;

  var ICON = {
    solar: '<circle cx="12" cy="12" r="4.2"/><g stroke-linecap="round"><path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/></g>',
    wind:  '<g stroke-linecap="round" fill="none"><path d="M3 8h9.5a2.6 2.6 0 1 0-2.6-2.6"/><path d="M3 12h13a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 16h7.5a2.2 2.2 0 1 1-2.2 2.2"/></g>',
    batt:  '<rect x="2.6" y="6.5" width="15.4" height="11" rx="2.6" fill="none"/><path d="M19.4 10.4h1.8v3.2h-1.8z" stroke="none"/><path d="M11.2 8.6 8.2 13h2.5l-.9 2.8 3.3-4.5h-2.6z" stroke="none"/>',
    coal:  '<path d="M3.2 17.8 7 10.4l3.1 3.4 3.4-6.2 4.1 7.4 2.2-2.4v5.2z" stroke="none"/><circle cx="7.2" cy="6.4" r="1.4" stroke="none"/>',
    gas:   '<path d="M12 2.6s5.2 4.6 5.2 9.2a5.2 5.2 0 0 1-10.4 0c0-1.9 1-3.6 1.9-4.8.3 1.4 1.1 2.3 2 2.3 1.3 0 1.9-1.4 1.3-6.7z" stroke="none"/>'
  };

  var TECHS = [
    { key: 'solar', name: 'Solar', fixed: 554000, colour: 'var(--g-solar)',
      tag: 'Free, gone by six',
      note: 'The cheapest energy ever built, and completely absent at the moment demand peaks.' },
    { key: 'wind', name: 'Wind', fixed: 585000, colour: 'var(--g-wind)',
      tag: 'Works nights',
      note: 'Blows hardest at 3am when nobody wants it, and drops off around midday.' },
    { key: 'batt', name: 'Battery', fixed: 420000, colour: 'var(--g-batt)',
      tag: 'Four hours deep',
      note: 'Moves energy from when you have it to when you need it. Never makes any of its own.' },
    { key: 'coal', name: 'Coal', fixed: 1010000, colour: 'var(--g-coal)',
      tag: "Won't turn down",
      note: 'Cheap to run, but it never drops below 45%. Stack it with solar and your free energy has nowhere to go.' },
    { key: 'gas', name: 'Gas', fixed: 407000, colour: 'var(--g-gas)',
      tag: 'Instant, and pricey',
      note: 'Any output you want the second you want it. The fuel bill is the catch.' }
  ];

  /* ── the model ─────────────────────────────────────────────────────────── */
  function clear(mix, stress) {
    var sK = stress.cloudy ? 0.3 : 1;
    var wK = stress.still ? 0.1 : 1;
    var soc = mix.batt * BATT_HOURS;
    var hours = [], vc = 0, served = 0, dark = 0, spill = 0;

    for (var h = 0; h < 24; h++) {
      var d = DEMAND[h];
      var o = { solar: 0, wind: 0, batt: 0, coal: 0, gas: 0 };

      o.solar = mix.solar * 1000 * CF_SOLAR[h] * sK;
      o.wind  = mix.wind  * 1000 * CF_WIND[h]  * wK;
      o.coal  = mix.coal * 1000 * COAL_FLOOR;          /* the floor, always on */

      var net = d - o.solar - o.wind - o.coal;

      if (net < 0) {
        var room = Math.min(mix.batt * 1000, (mix.batt * BATT_HOURS - soc) * 1000, -net);
        if (room > 0) { soc += room / 1000; o.batt = -room; }
        spill += (-net) - Math.max(room, 0);
        net = 0;
      } else {
        var fb = Math.min(mix.batt * 1000, soc * 1000, net);
        if (fb > 0) { soc -= fb / 1000; o.batt = fb; net -= fb; }
        var more = Math.min(mix.coal * 1000 - o.coal, net);
        o.coal += more; net -= more;
        o.gas = Math.min(mix.gas * 1000, net); net -= o.gas;
        if (net > 0.5) dark++;
      }

      vc += Math.abs(o.batt) * 4 + o.coal * 61 + o.gas * 141;
      served += d - Math.max(net, 0);
      hours.push({ demand: d, o: o, short: Math.max(net, 0) });
    }

    var fx = 0;
    TECHS.forEach(function (t) { fx += mix[t.key] * t.fixed; });

    return { hours: hours, dark: dark, spill: spill,
             cost: served > 0 ? (fx + vc) / served : 0 };
  }

  /* ── hints: the most useful true thing about the state you're in ───────── */
  function hint(mix, res, stress) {
    var evening = res.hours.slice(17, 22).filter(function (x) { return x.short > 0.5; }).length;
    var spillGWh = res.spill / 1000;
    var gasE = res.hours.reduce(function (s, x) { return s + x.o.gas; }, 0);
    var totE = res.hours.reduce(function (s, x) { return s + x.demand; }, 0);

    if (res.dark && evening >= 2)
      return ['Everyone got home and put the kettle on.',
              'The sun clocked off an hour ago. Something else has to cover that.'];
    if (res.dark && (stress.still || stress.cloudy))
      return ['The weather turned and your grid folded.',
              'This is what firm capacity is for. It is also why it costs money.'];
    if (res.dark)
      return ['You are short somewhere.', 'Find the red. That is the hour that failed.'];
    if (spillGWh > 25 && mix.coal >= 8)
      return [Math.round(spillGWh) + ' GWh thrown straight in the bin.',
              'Your coal will not drop below 45%, so at midday the free solar has nowhere to go.'];
    if (spillGWh > 25)
      return [Math.round(spillGWh) + ' GWh thrown straight in the bin.',
              'You are making more at midday than anyone can use. A battery would carry it to the evening.'];
    if (gasE / totE > 0.4)
      return ['Lights on, and gas is doing the heavy lifting.',
              'It never lets you down. It also never stops charging you $141 a megawatt hour.'];
    if (res.cost > 130)
      return ['Nobody went dark. Good.', 'Now make it cheaper. Something in there is idling and still billing you.'];
    if (res.cost > 112)
      return ['That is a solid grid.', 'Best anyone has managed is about $104. Try shifting the balance.'];
    if (!stress.still && !stress.cloudy)
      return ['That is a seriously good grid.', 'Now press one of the buttons below and see if it holds.'];
    return ['Cheap, clean, and it survived the weather.',
            'That is the entire job, and it is harder than it looks.'];
  }

  /* ── drawing ───────────────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  /* Each fuel gets a texture. It reads as character, and it doubles as the
     secondary encoding a five-series stack needs for colourblind readers. */
  function defs() {
    var d = el('defs', {}), p;

    p = el('pattern', { id: 'px-solar', width: 9, height: 9, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el('circle', { cx: 4.5, cy: 4.5, r: 1.3, fill: 'rgba(255,255,255,.34)' }));
    d.appendChild(p);

    p = el('pattern', { id: 'px-wind', width: 22, height: 9, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el('path', { d: 'M0 6 q5.5 -5 11 0 t11 0', fill: 'none',
      stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1.4 }));
    d.appendChild(p);

    p = el('pattern', { id: 'px-batt', width: 11, height: 11, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el('path', { d: 'M6.4 1.6 3.4 6h2.4l-1 3.6 3.6-4.9H6z', fill: 'rgba(255,255,255,.32)' }));
    d.appendChild(p);

    p = el('pattern', { id: 'px-coal', width: 7, height: 7, patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)' });
    p.appendChild(el('rect', { width: 3, height: 7, fill: 'rgba(0,0,0,.2)' }));
    d.appendChild(p);

    p = el('pattern', { id: 'px-gas', width: 13, height: 13, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el('path', { d: 'M6.5 2.6c2.4 2.2 2.8 4.1 1.6 5.5-.7.8-2.1.8-2.8 0C4 6.7 4.4 4.8 6.5 2.6z',
      fill: 'rgba(255,255,255,.24)' }));
    d.appendChild(p);

    p = el('pattern', { id: 'px-short', width: 8, height: 8, patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)' });
    p.appendChild(el('rect', { width: 3.4, height: 8, fill: 'rgba(255,255,255,.55)' }));
    d.appendChild(p);

    var f = el('filter', { id: 'px-glow', x: '-30%', y: '-120%', width: '160%', height: '440%' });
    f.appendChild(el('feGaussianBlur', { stdDeviation: 3.2, result: 'b1' }));
    f.appendChild(el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 7.5, result: 'b2' }));
    var m = el('feMerge', {});
    ['b2', 'b1', 'b1'].forEach(function (x) { m.appendChild(el('feMergeNode', { in: x })); });
    f.appendChild(m);
    d.appendChild(f);
    return d;
  }

  var PAT = { solar: 'px-solar', wind: 'px-wind', batt: 'px-batt', coal: 'px-coal', gas: 'px-gas' };

  function draw(svg, hours, failing) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(defs());

    var W = 720, H = 300, L = 46, R = 12, T = 16, B = 28;
    var pw = W - L - R, ph = H - T - B;

    var peak = 0;
    hours.forEach(function (x) {
      var tot = 0;
      TECHS.forEach(function (t) { tot += Math.max(x.o[t.key], 0); });
      peak = Math.max(peak, x.demand, tot);
    });
    var yMax = Math.max(Math.ceil(peak / 5000) * 5000, 35000);
    var X = function (h) { return L + (h / 23) * pw; };
    var Y = function (v) { return T + ph - (v / yMax) * ph; };

    for (var g = 0; g <= 4; g++) {
      var v = (yMax / 4) * g;
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v),
        stroke: 'var(--ink-08)', 'stroke-width': 1 }));
      var lab = el('text', { x: L - 9, y: Y(v) + 4, 'text-anchor': 'end',
        fill: 'var(--ink-45)', 'font-size': 11 });
      lab.textContent = Math.round(v / 1000) + ' GW';
      svg.appendChild(lab);
    }
    [[0, '00'], [6, '06'], [12, '12'], [18, '18'], [23, '23']].forEach(function (p) {
      var t = el('text', { x: X(p[0]), y: H - 7, 'text-anchor': 'middle',
        fill: 'var(--ink-45)', 'font-size': 11 });
      t.textContent = p[1];
      svg.appendChild(t);
    });

    /* smoothed so it reads as energy flowing, not a bar chart */
    function area(base, top) {
      var d = 'M' + X(0) + ',' + Y(top[0]), i, j, cx, bx;
      for (i = 1; i < 24; i++) {
        cx = (X(i - 1) + X(i)) / 2;
        d += ' C' + cx + ',' + Y(top[i - 1]) + ' ' + cx + ',' + Y(top[i]) + ' ' + X(i) + ',' + Y(top[i]);
      }
      d += ' L' + X(23) + ',' + Y(base[23]);
      for (j = 22; j >= 0; j--) {
        bx = (X(j + 1) + X(j)) / 2;
        d += ' C' + bx + ',' + Y(base[j + 1]) + ' ' + bx + ',' + Y(base[j]) + ' ' + X(j) + ',' + Y(base[j]);
      }
      return d + ' Z';
    }

    var base = hours.map(function () { return 0; });
    TECHS.forEach(function (t) {
      var top = hours.map(function (x, i) { return base[i] + Math.max(x.o[t.key], 0); });
      if (top.some(function (v, i) { return v - base[i] > 1; })) {
        var d = area(base, top);
        svg.appendChild(el('path', { d: d, fill: t.colour, opacity: .93 }));
        svg.appendChild(el('path', { d: d, fill: 'url(#' + PAT[t.key] + ')' }));
      }
      base = top;
    });

    hours.forEach(function (x, i) {                       /* the hours you failed */
      if (x.short <= 0.5) return;
      var w = pw / 23;
      var geo = { x: X(i) - w / 2, y: Y(x.demand), width: w,
        height: Math.max(Y(x.demand - x.short) - Y(x.demand), 3), rx: 2 };
      /* Bright orange, hatched, and outlined. Plain red was too close to coal's
         maroon and the failing hours simply did not read. */
      svg.appendChild(el('rect', Object.assign({}, geo, {
        fill: 'var(--g-short)', stroke: 'var(--card)', 'stroke-width': 1.4,
        'class': failing ? 'g-shortfall' : '' })));
      svg.appendChild(el('rect', Object.assign({}, geo, {
        fill: 'url(#px-short)', 'class': failing ? 'g-shortfall' : '' })));
    });

    var dl = 'M' + X(0) + ',' + Y(hours[0].demand);
    for (var k = 1; k < 24; k++) {
      var mx = (X(k - 1) + X(k)) / 2;
      dl += ' C' + mx + ',' + Y(hours[k - 1].demand) + ' ' + mx + ',' + Y(hours[k].demand) +
            ' ' + X(k) + ',' + Y(hours[k].demand);
    }
    svg.appendChild(el('path', { d: dl, fill: 'none', stroke: 'var(--g-demand-glow)',
      'stroke-width': 3, 'stroke-linecap': 'round', filter: 'url(#px-glow)' }));
    svg.appendChild(el('path', { d: dl, fill: 'none', stroke: 'var(--g-demand)',
      'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }

  /* ── interface ─────────────────────────────────────────────────────────── */
  window.buildGridGame = function (mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mix = { solar: 20, wind: 20, batt: 6, coal: 4, gas: 16 };
    /* Deliberately lit for 20 hours and dark from 17:00 to 20:00. Demand peaks
       at 19:00 and solar's capacity factor at 19:00 is 0.02, so the game hands
       you the entire lesson before you have touched anything. */
    var stress = { cloudy: false, still: false };
    var best = null;
    try { best = parseFloat(localStorage.getItem('grid-best-v2')) || null; } catch (e) {}

    mount.innerHTML =
      '<div class="g-chart"><svg viewBox="0 0 720 300" preserveAspectRatio="xMidYMid meet"' +
      ' role="img" aria-label="Generation by hour of the day against demand"></svg></div>' +
      '<div class="g-legend" id="gLeg"></div>' +
      '<div class="g-hint" id="gHint"><b></b><span></span></div>' +
      '<div class="g-score">' +
        '<div class="g-stat" id="stLit"><div class="g-stat-v"><span id="nLit">0</span><em>/24</em></div>' +
          '<div class="g-stat-k" id="kLit">Hours the lights stayed on</div></div>' +
        '<div class="g-stat"><div class="g-stat-v" id="nCost">$0</div>' +
          '<div class="g-stat-k">Per MWh, all in</div></div>' +
        '<div class="g-stat g-stat-best"><div class="g-stat-v" id="nBest">&middot;&middot;&middot;</div>' +
          '<div class="g-stat-k">Your cheapest clean run</div></div>' +
      '</div>' +
      '<div class="g-dials" id="gDials"></div>' +
      '<div class="g-stress"><span class="g-stress-k">Now try to break it</span>' +
      '<div class="g-stress-row" id="gStress"></div></div>' +
      '<p class="g-live" id="gLive" role="status" aria-live="polite"></p>';

    var svg   = mount.querySelector('svg');
    var live  = mount.querySelector('#gLive');
    var hintW = mount.querySelector('#gHint');
    var hintB = hintW.querySelector('b');
    var hintS = hintW.querySelector('span');
    var nCost = mount.querySelector('#nCost');
    var nLit  = mount.querySelector('#nLit');

    mount.querySelector('#gLeg').innerHTML = TECHS.map(function (t) {
      return '<span class="g-key"><i style="background:' + t.colour + '"></i>' + t.name + '</span>';
    }).join('') + '<span class="g-key"><i class="g-key-line"></i>Demand</span>';

    var dials = mount.querySelector('#gDials');
    TECHS.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'g-dial';
      row.style.setProperty('--c', t.colour);
      row.innerHTML =
        '<div class="g-dial-head">' +
          '<svg class="g-ico" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"' +
          ' stroke="currentColor" stroke-width="1.5">' + ICON[t.key] + '</svg>' +
          '<span class="g-dial-n">' + t.name + '</span>' +
          '<span class="g-dial-tag">' + t.tag + '</span>' +
          '<span class="g-dial-v" id="v-' + t.key + '" title="Drag me sideways">0<em>GW</em></span>' +
        '</div>' +
        '<div class="g-slider" id="s-' + t.key + '" tabindex="0" role="slider"' +
          ' aria-label="' + t.name + ' capacity in gigawatts"' +
          ' aria-valuemin="0" aria-valuemax="' + MAX_GW + '" aria-valuenow="' + mix[t.key] + '">' +
          '<span class="g-track"><span class="g-fill" id="f-' + t.key + '"></span></span>' +
          '<span class="g-thumb" id="t-' + t.key + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"' +
            ' stroke="currentColor" stroke-width="1.6">' + ICON[t.key] + '</svg>' +
          '</span>' +
        '</div>' +
        '<p class="g-dial-note">' + t.note + '</p>';
      dials.appendChild(row);
    });

    var srow = mount.querySelector('#gStress');
    [['cloudy', 'Cloudy day', 'Solar drops to a third'],
     ['still',  'Still night', 'The wind stops']].forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-stress-btn';
      b.dataset.s = s[0];
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<b>' + s[1] + '</b><span>' + s[2] + '</span>';
      srow.appendChild(b);
    });

    /* ── animation ───────────────────────────────────────────────────────── */
    var shown = null, raf = null;
    function lerp(a, b, k) {
      return b.map(function (hb, i) {
        var ha = a[i], o = {};
        TECHS.forEach(function (t) { o[t.key] = ha.o[t.key] + (hb.o[t.key] - ha.o[t.key]) * k; });
        return { demand: hb.demand, o: o, short: ha.short + (hb.short - ha.short) * k };
      });
    }
    function animateChart(target, failing) {
      if (reduce || !shown) { shown = target; draw(svg, target, failing); return; }
      cancelAnimationFrame(raf);
      var from = shown, t0 = null;
      raf = requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min((ts - t0) / 320, 1);
        var e = 1 - Math.pow(1 - k, 3);
        shown = lerp(from, target, e);
        draw(svg, shown, failing);
        if (k < 1) raf = requestAnimationFrame(step); else shown = target;
      });
    }

    var curCost = 0, curLit = 0, nraf = null;
    function animateNumbers(cost, lit) {
      if (reduce) {
        nCost.textContent = '$' + Math.round(cost);
        nLit.textContent = String(lit);
        curCost = cost; curLit = lit;
        return;
      }
      cancelAnimationFrame(nraf);
      var c0 = curCost, l0 = curLit, t0 = null;
      nraf = requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min((ts - t0) / 320, 1);
        var e = 1 - Math.pow(1 - k, 3);
        nCost.textContent = '$' + Math.round(c0 + (cost - c0) * e);
        nLit.textContent = String(Math.round(l0 + (lit - l0) * e));
        if (k < 1) nraf = requestAnimationFrame(step);
        else { curCost = cost; curLit = lit; }
      });
    }

    var lastHint = '', hintTimer = null;
    function render() {
      var res = clear(mix, stress);
      animateChart(res.hours, res.dark > 0);

      TECHS.forEach(function (t) {
        var pct = mix[t.key] / MAX_GW * 100;
        mount.querySelector('#v-' + t.key).innerHTML = mix[t.key] + '<em>GW</em>';
        mount.querySelector('#f-' + t.key).style.width = pct + '%';
        mount.querySelector('#t-' + t.key).style.left = pct + '%';
        var sl = mount.querySelector('#s-' + t.key);
        sl.setAttribute('aria-valuenow', mix[t.key]);
        sl.setAttribute('aria-valuetext', mix[t.key] + ' gigawatts');
      });

      var lit = 24 - res.dark, ok = res.dark === 0;
      if (ok && (best === null || res.cost < best)) {
        best = res.cost;
        try { localStorage.setItem('grid-best-v2', String(best)); } catch (e) {}
      }

      animateNumbers(res.cost, lit);
      mount.querySelector('#stLit').className = 'g-stat ' + (ok ? 'is-ok' : 'is-bad');
      mount.querySelector('#kLit').textContent = ok ? 'Hours the lights stayed on' : 'Hours lit. You went dark.';
      mount.querySelector('#nBest').innerHTML = best === null ? '&middot;&middot;&middot;' : '$' + Math.round(best);

      var h = hint(mix, res, stress);
      if (h[0] !== lastHint) {
        lastHint = h[0];
        clearTimeout(hintTimer);
        hintW.classList.remove('is-in');
        hintTimer = setTimeout(function () {
          hintB.textContent = h[0];
          hintS.textContent = h[1];
          hintW.classList.add('is-in');
        }, reduce ? 0 : 120);
      }
      hintW.classList.toggle('is-bad', res.dark > 0);

      live.textContent = ok
        ? 'Lights on all 24 hours at $' + Math.round(res.cost) + ' per megawatt hour.'
        : 'Dark for ' + res.dark + ' ' + (res.dark === 1 ? 'hour' : 'hours') + '.';
    }

    /* ── each fuel throws off what a fuel throws off ─────────────────────
       Solar sheds rays, wind trails gusts, the battery flicks electrons, coal
       coughs soot, gas licks flame. Purely for the joy of it, so the whole
       thing is skipped under prefers-reduced-motion and capped hard: a slider
       people scrub for a minute must not quietly grow a thousand DOM nodes. */
    var COUNT = { solar: 3, wind: 2, batt: 3, coal: 2, gas: 2 };
    var alive = 0, MAX_ALIVE = 90;

    function emit(t, sl, pct, dir) {
      if (reduce || alive > MAX_ALIVE) return;
      var n = COUNT[t.key];
      for (var i = 0; i < n; i++) {
        var b = document.createElement('i');
        b.className = 'g-p g-p-' + t.key;
        b.style.left = pct + '%';

        if (t.key === 'solar') {                       /* rays, straight out */
          b.style.setProperty('--a', (Math.random() * 360) + 'deg');
          b.style.setProperty('--d', (13 + Math.random() * 13) + 'px');
        } else if (t.key === 'wind') {                 /* gusts, trailing behind */
          b.style.setProperty('--dx', (-dir * (26 + Math.random() * 30)) + 'px');
          b.style.setProperty('--dy', ((Math.random() - 0.5) * 15) + 'px');
          b.style.setProperty('--w', (9 + Math.random() * 12) + 'px');
        } else if (t.key === 'batt') {                 /* electrons, scattering */
          b.style.setProperty('--dx', ((Math.random() - 0.5) * 44) + 'px');
          b.style.setProperty('--dy', (-8 - Math.random() * 20) + 'px');
        } else if (t.key === 'coal') {                 /* soot, drifting up slow */
          b.style.setProperty('--dx', ((Math.random() - 0.5) * 22) + 'px');
          b.style.setProperty('--dy', (-16 - Math.random() * 16) + 'px');
          b.style.setProperty('--s', (0.7 + Math.random() * 1.5).toFixed(2));
        } else {                                       /* flame, rising and wobbling */
          b.style.setProperty('--dx', ((Math.random() - 0.5) * 15) + 'px');
          b.style.setProperty('--dy', (-15 - Math.random() * 15) + 'px');
        }
        b.style.animationDelay = (Math.random() * 55) + 'ms';
        sl.appendChild(b);
        alive++;
        b.addEventListener('animationend', function () {
          if (this.parentNode) this.parentNode.removeChild(this);
          alive--;
        });
      }
    }

    /* ── dragging: the slider, and the number itself ─────────────────────── */
    function setVal(k, v) {
      v = Math.max(0, Math.min(MAX_GW, Math.round(v)));
      if (v === mix[k]) return;
      mix[k] = v;
      render();
    }

    TECHS.forEach(function (t) {
      var sl = mount.querySelector('#s-' + t.key);
      var lastV = mix[t.key], lastEmit = 0;

      function puff(dir) {
        var now = performance.now();
        if (now - lastEmit < 45) return;               /* throttled to ~22 a second */
        lastEmit = now;
        emit(t, sl, mix[t.key] / MAX_GW * 100, dir || 1);
      }
      function changed() {
        if (mix[t.key] === lastV) return;
        puff(mix[t.key] > lastV ? 1 : -1);
        lastV = mix[t.key];
      }
      function fromX(clientX) {
        var r = sl.getBoundingClientRect();
        setVal(t.key, ((clientX - r.left) / r.width) * MAX_GW);
        changed();
      }
      sl.addEventListener('pointerdown', function (e) {
        sl.setPointerCapture(e.pointerId);
        sl.classList.add('is-drag');
        fromX(e.clientX);
        e.preventDefault();
      });
      sl.addEventListener('pointermove', function (e) {
        if (sl.hasPointerCapture(e.pointerId)) fromX(e.clientX);
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        sl.addEventListener(ev, function () { sl.classList.remove('is-drag'); });
      });
      sl.addEventListener('keydown', function (e) {
        var d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
        if (d !== undefined) { setVal(t.key, mix[t.key] + d * (e.shiftKey ? 5 : 1)); changed(); e.preventDefault(); return; }
        if (e.key === 'Home')     { setVal(t.key, 0); changed(); e.preventDefault(); }
        if (e.key === 'End')      { setVal(t.key, MAX_GW); changed(); e.preventDefault(); }
        if (e.key === 'PageUp')   { setVal(t.key, mix[t.key] + 5); changed(); e.preventDefault(); }
        if (e.key === 'PageDown') { setVal(t.key, mix[t.key] - 5); changed(); e.preventDefault(); }
      });

      /* scrub the number sideways, the way a design tool does it */
      var vEl = mount.querySelector('#v-' + t.key), sx = 0, sv = 0;
      vEl.addEventListener('pointerdown', function (e) {
        vEl.setPointerCapture(e.pointerId);
        vEl.classList.add('is-scrub');
        sx = e.clientX; sv = mix[t.key];
        e.preventDefault();
      });
      vEl.addEventListener('pointermove', function (e) {
        if (!vEl.hasPointerCapture(e.pointerId)) return;
        setVal(t.key, sv + (e.clientX - sx) / 9);
        changed();
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        vEl.addEventListener(ev, function () { vEl.classList.remove('is-scrub'); });
      });
    });

    mount.addEventListener('click', function (e) {
      var s = e.target.closest('.g-stress-btn');
      if (!s) return;
      stress[s.dataset.s] = !stress[s.dataset.s];
      s.setAttribute('aria-pressed', String(stress[s.dataset.s]));
      s.classList.toggle('is-on', stress[s.dataset.s]);
      render();
    });

    render();
    hintW.classList.add('is-in');
  };
})();
