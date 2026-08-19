/* Build the Grid ------------------------------------------------------------
   Pick a mix. It clears every hour of one day, cheapest first, and tells you
   whether the lights stayed on and what it cost.

   The numbers are from "Build an electricity mix V8.xlsx", Zone 1: the hourly
   demand shape, the solar and wind capacity factors, and the capital and fuel
   costs. The whole game is really one fact from that sheet - demand peaks at
   19:00, and solar's capacity factor at 19:00 is 0.02.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* Demand by hour, MW. Peaks 32,071 at 19:00; troughs 20,314 at 05:00. */
  var DEMAND = [25000, 23752, 21858, 20538, 20314, 21611, 24820, 27680,
                29200, 29084, 28337, 27296, 26680, 26178, 25986, 26210,
                27482, 30719, 32071, 30898, 29876, 28454, 27467, 26432];

  /* Capacity factors. Wind runs hardest overnight, solar at midday - they
     cover for each other, and neither turns up for the 19:00 peak. */
  var CF_SOLAR = [0, 0, 0, 0, 0, 0, 0.04, 0.25, 0.51, 0.54, 0.56, 0.55,
                  0.56, 0.58, 0.59, 0.60, 0.53, 0.22, 0.02, 0, 0, 0, 0, 0];
  var CF_WIND  = [0.39, 0.36, 0.33, 0.30, 0.28, 0.27, 0.23, 0.20, 0.17, 0.14,
                  0.13, 0.13, 0.13, 0.14, 0.15, 0.17, 0.20, 0.25, 0.34, 0.43,
                  0.47, 0.49, 0.46, 0.43];

  /* fixed: $/GW/day (capex at 8% over 25 years, plus fixed O&M).
     variable: $/MWh of fuel and variable O&M. */
  var TECHS = [
    { key: 'solar', name: 'Solar',   fixed: 554000, variable: 0,   colour: 'var(--g-solar)',
      note: 'Cheapest energy there is. Clocks off at six.' },
    { key: 'wind',  name: 'Wind',    fixed: 585000, variable: 0,   colour: 'var(--g-wind)',
      note: 'Blows hardest while everyone is asleep.' },
    { key: 'batt',  name: 'Battery', fixed: 420000, variable: 4,   colour: 'var(--g-batt)',
      note: 'Four hours deep. Moves energy, never makes it.' },
    { key: 'gas',   name: 'Gas',     fixed: 407000, variable: 141, colour: 'var(--g-gas)',
      note: 'Cheap to build, brutal to run. Your safety net.' }
  ];

  var MAX_GW = 40;
  var STEP   = 2;      /* 1 GW steps meant 40 clicks a dial; nobody is doing that */

  function clear(mix, stress) {
    var solarK = stress.cloudy ? 0.3 : 1;
    var windK  = stress.still  ? 0.1 : 1;

    var soc = mix.batt * 4;             /* four hours deep, starts full */
    var hours = [], varCost = 0, served = 0, dark = 0;

    for (var h = 0; h < 24; h++) {
      var demand = DEMAND[h];
      var o = { solar: 0, wind: 0, batt: 0, gas: 0 };

      o.solar = mix.solar * 1000 * CF_SOLAR[h] * solarK;
      o.wind  = mix.wind  * 1000 * CF_WIND[h]  * windK;
      var net = demand - o.solar - o.wind;

      if (net < 0) {                    /* surplus: charge, spill the rest */
        var room = Math.min(mix.batt * 1000, (mix.batt * 4 - soc) * 1000, -net);
        if (room > 0) { soc += room / 1000; o.batt = -room; }
      } else {                          /* shortfall: stored energy, then gas */
        var fromBatt = Math.min(mix.batt * 1000, soc * 1000, net);
        if (fromBatt > 0) { soc -= fromBatt / 1000; o.batt = fromBatt; net -= fromBatt; }
        var fromGas = Math.min(mix.gas * 1000, net);
        o.gas = fromGas; net -= fromGas;
        if (net > 0.5) dark++;
      }

      varCost += Math.abs(o.batt) * 4 + o.gas * 141;
      served  += demand - Math.max(net, 0);
      hours.push({ demand: demand, o: o, short: Math.max(net, 0) });
    }

    var fixed = 0;
    TECHS.forEach(function (t) { fixed += mix[t.key] * t.fixed; });

    return { hours: hours, dark: dark, cost: served > 0 ? (fixed + varCost) / served : 0 };
  }

  /* ── chart ─────────────────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  function draw(svg, res) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 720, H = 290, L = 46, R = 12, T = 14, B = 26;
    var pw = W - L - R, ph = H - T - B;

    var peak = 0;
    res.hours.forEach(function (x) {
      var tot = x.o.solar + x.o.wind + Math.max(x.o.batt, 0) + x.o.gas;
      peak = Math.max(peak, x.demand, tot);
    });
    var yMax = Math.max(Math.ceil(peak / 5000) * 5000, 35000);
    var X = function (h) { return L + (h / 23) * pw; };
    var Y = function (v) { return T + ph - (v / yMax) * ph; };

    for (var g = 0; g <= 4; g++) {
      var v = (yMax / 4) * g;
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v),
        stroke: 'var(--ink-08)', 'stroke-width': 1 }));
      var t = el('text', { x: L - 9, y: Y(v) + 4, 'text-anchor': 'end',
        fill: 'var(--ink-45)', 'font-size': 11 });
      t.textContent = Math.round(v / 1000) + ' GW';
      svg.appendChild(t);
    }
    [[0, '00'], [6, '06'], [12, '12'], [18, '18'], [23, '23']].forEach(function (p) {
      var t = el('text', { x: X(p[0]), y: H - 6, 'text-anchor': 'middle',
        fill: 'var(--ink-45)', 'font-size': 11 });
      t.textContent = p[1];
      svg.appendChild(t);
    });

    var base = res.hours.map(function () { return 0; });
    TECHS.forEach(function (tech) {
      var top = res.hours.map(function (x, i) { return base[i] + Math.max(x.o[tech.key], 0); });
      var d = 'M' + X(0) + ',' + Y(base[0]);
      for (var i = 0; i < 24; i++) d += ' L' + X(i) + ',' + Y(top[i]);
      for (var j = 23; j >= 0; j--) d += ' L' + X(j) + ',' + Y(base[j]);
      svg.appendChild(el('path', { d: d + ' Z', fill: tech.colour, opacity: .92 }));
      base = top;
    });

    res.hours.forEach(function (x, i) {                 /* the dark hours */
      if (x.short <= 0.5) return;
      var w = pw / 23;
      svg.appendChild(el('rect', { x: X(i) - w / 2, y: Y(x.demand), width: w,
        height: Math.max(Y(x.demand - x.short) - Y(x.demand), 3),
        fill: 'var(--signal)', opacity: .9 }));
    });

    var dl = 'M';
    res.hours.forEach(function (x, i) { dl += (i ? ' L' : '') + X(i) + ',' + Y(x.demand); });
    svg.appendChild(el('path', { d: dl, fill: 'none', stroke: 'var(--ink)',
      'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
  }

  /* ── interface ─────────────────────────────────────────────────────────── */
  window.buildGridGame = function (mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    var mix = { solar: 10, wind: 8, batt: 2, gas: 24 };   /* lit all day except the
                                                          evening peak: the whole
                                                          point, handed to you */
    var stress = { cloudy: false, still: false };
    var best = null;
    try { best = parseFloat(localStorage.getItem('grid-best')) || null; } catch (e) {}

    mount.innerHTML =
      '<div class="g-chart"><svg viewBox="0 0 720 290" preserveAspectRatio="xMidYMid meet"' +
      ' role="img" aria-label="Generation by hour of the day against demand"></svg></div>' +
      '<div class="g-legend" id="gLeg"></div>' +
      '<div class="g-score" id="gScore"></div>' +
      '<div class="g-dials" id="gDials"></div>' +
      '<div class="g-stress"><span class="g-stress-k">Now try to break it</span>' +
      '<div class="g-stress-row" id="gStress"></div></div>' +
      '<p class="g-live" id="gLive" role="status" aria-live="polite"></p>';

    var svg   = mount.querySelector('svg');
    var score = mount.querySelector('#gScore');
    var live  = mount.querySelector('#gLive');

    mount.querySelector('#gLeg').innerHTML = TECHS.map(function (t) {
      return '<span class="g-key"><i style="background:' + t.colour + '"></i>' + t.name + '</span>';
    }).join('') + '<span class="g-key"><i class="g-key-line"></i>Demand</span>';

    var dials = mount.querySelector('#gDials');
    TECHS.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'g-dial';
      row.innerHTML =
        '<div class="g-dial-head"><i style="background:' + t.colour + '"></i>' +
        '<span class="g-dial-n">' + t.name + '</span>' +
        '<span class="g-dial-v" id="v-' + t.key + '"></span></div>' +
        '<div class="g-dial-ctl">' +
        '<button type="button" class="g-btn" data-k="' + t.key + '" data-d="-1"' +
        ' aria-label="Less ' + t.name + '">&minus;</button>' +
        '<div class="g-bar"><span id="b-' + t.key + '" style="background:' + t.colour + '"></span></div>' +
        '<button type="button" class="g-btn" data-k="' + t.key + '" data-d="1"' +
        ' aria-label="More ' + t.name + '">+</button></div>' +
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

    function render() {
      var res = clear(mix, stress);
      draw(svg, res);

      TECHS.forEach(function (t) {
        mount.querySelector('#v-' + t.key).textContent = mix[t.key] + ' GW';
        mount.querySelector('#b-' + t.key).style.width = (mix[t.key] / MAX_GW * 100) + '%';
      });

      var lit = 24 - res.dark, ok = res.dark === 0;
      if (ok && (best === null || res.cost < best)) {
        best = res.cost;
        try { localStorage.setItem('grid-best', String(best)); } catch (e) {}
      }

      score.innerHTML =
        '<div class="g-stat ' + (ok ? 'is-ok' : 'is-bad') + '">' +
          '<div class="g-stat-v">' + lit + '<span>/24</span></div>' +
          '<div class="g-stat-k">' + (ok ? 'Hours the lights stayed on' : 'Hours lit. You went dark.') + '</div></div>' +
        '<div class="g-stat"><div class="g-stat-v">$' + Math.round(res.cost) + '</div>' +
          '<div class="g-stat-k">Per MWh, all in</div></div>' +
        (best !== null
          ? '<div class="g-stat g-stat-best"><div class="g-stat-v">$' + Math.round(best) +
            '</div><div class="g-stat-k">Your cheapest clean run</div></div>'
          : '<div class="g-stat g-stat-best"><div class="g-stat-v">&middot;&middot;&middot;</div>' +
            '<div class="g-stat-k">No clean run yet</div></div>');

      live.textContent = ok
        ? 'Lights on all 24 hours at $' + Math.round(res.cost) + ' per MWh.'
        : 'Dark for ' + res.dark + ' ' + (res.dark === 1 ? 'hour' : 'hours') + '.';
    }

    mount.addEventListener('click', function (e) {
      var b = e.target.closest('.g-btn');
      if (b) {
        mix[b.dataset.k] = Math.max(0, Math.min(MAX_GW, mix[b.dataset.k] + (+b.dataset.d) * STEP));
        render();
        return;
      }
      var s = e.target.closest('.g-stress-btn');
      if (s) {
        stress[s.dataset.s] = !stress[s.dataset.s];
        s.setAttribute('aria-pressed', String(stress[s.dataset.s]));
        s.classList.toggle('is-on', stress[s.dataset.s]);
        render();
      }
    });

    /* hold to run the number up */
    var held = null;
    mount.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.g-btn');
      if (!b) return;
      var n = 0;
      held = setInterval(function () {
        if (++n < 5) return;
        mix[b.dataset.k] = Math.max(0, Math.min(MAX_GW, mix[b.dataset.k] + (+b.dataset.d) * STEP));
        render();
      }, 55);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      mount.addEventListener(ev, function () { clearInterval(held); });
    });

    render();
  };
})();
