/* Research page charts. Data re-derived 2026-08-19; see the working on each finding. */
window.addEventListener('load', function () {
  if (!window.ariaBars) return;

  /* Plot the gap, not the accuracy: at 0-100 every bar looked identical. */
  ariaBars('reproChart', [
    ['Coal', 0.001, '0.00%'], ['Grid solar', 0.05, '0.05%'],
    ['Wind', 1.01, '1.01%'], ['Gas', 1.56, '1.56%']
  ], { max: 2, colour: 'var(--good)' });

  ariaBars('curtChart', [
    ['2021', 1.24, '1.24'], ['2022', 1.36, '1.36'], ['2023', 3.03, '3.03'],
    ['2024', 3.65, '3.65'], ['2025', 6.44, '6.44 TWh']
  ], { max: 7, colour: 'var(--signal)' });

  ariaBars('capChart', [
    ['Coopers Gap', 106.6, '106.6%'], ['MacIntyre', 105.1, '105.1%'],
    ['Wind median', 72.1, '72.1%'], ['Solar median', 39.8, '39.8%'],
    ['Darling Downs', 12.9, '12.9%']
  ], { max: 112, colour: function (r) {
    return r[1] >= 100 ? 'var(--good)' : (r[1] >= 60 ? 'var(--accent)' : 'var(--signal)');
  }});

  ariaBars('boundChart', [
    ['Cost-based', 2, '~$1–2'], ['Conduct-based', 21, '$14–21']
  ], { max: 24, colour: function (r) { return r[1] > 10 ? 'var(--signal)' : 'var(--accent)'; }});

  ariaBars('sensChart', [
    ['Discount −2pp', 15.6, '15.6%'], ['Capex scenario', 11.0, '11.0%'],
    ['Wind calibration', 0.6, '0.6%']
  ], { max: 17, colour: function (r) { return r[1] > 10 ? 'var(--signal)' : 'var(--accent)'; }});

  (function () {
    var el = document.getElementById('bandChart');
    if (!el) return;
    var rows = [['≤ $0', 16664, 38214], ['$0–50', 9704, 3756], ['$50–300', 3081, 5756],
                ['$300–1k', 870, 2227], ['> $1k', 5213, 7769]];
    var max = 38214;
    el.innerHTML = rows.map(function (r) {
      var up = r[2] > r[1];
      return '<div style="margin-bottom:13px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:.74rem;color:var(--ink-60);margin-bottom:5px;gap:10px;">' +
          '<span>' + r[0] + '</span><span style="font-variant-numeric:tabular-nums;color:var(--ink-45);white-space:nowrap;">' +
          r[1].toLocaleString() + ' → ' + r[2].toLocaleString() + ' MW</span></div>' +
        '<div style="height:8px;background:var(--ink-08);border-radius:3px;overflow:hidden;margin-bottom:3px;">' +
          '<div class="bar-fill" style="height:100%;width:' + (r[1]/max*100).toFixed(1) + '%;background:var(--ink-28);"></div></div>' +
        '<div style="height:8px;background:var(--ink-08);border-radius:3px;overflow:hidden;">' +
          '<div class="bar-fill" style="height:100%;width:' + (r[2]/max*100).toFixed(1) + '%;background:' +
          (up ? 'var(--accent)' : 'var(--signal)') + ';"></div></div></div>';
    }).join('') + '<div style="font-size:.7rem;color:var(--ink-45);margin-top:8px;">Upper bar 2009, lower bar 2026.</div>';
  })();

  if (window.ariaLine) {
    ariaLine('gasChart', [{ name: 'Gas', colour: 'var(--signal)', points: [
      [0,-17.8],[1,-6.0],[2,-0.2],[3,1.0],[4,-0.6],[5,-7.9],[6,-31.4],[7,-48.0],[8,-34.0],
      [9,-13.2],[10,-0.1],[11,6.6],[12,9.3],[13,9.6],[14,4.7],[15,-12.1],[16,-64.0],[17,-138.9],
      [18,-159.6],[19,-150.0],[20,-126.3],[21,-92.4],[22,-57.7],[23,-34.5]]}], {
      yMin: -170, yMax: 20, yTicks: 4, height: 250,
      xLabels: [[0,'00:00'],[6,'06:00'],[12,'12:00'],[18,'18:00'],[23,'23:00']],
      alt: 'Gas generation change by hour, negative in the evening and positive at midday' });
  }
})
