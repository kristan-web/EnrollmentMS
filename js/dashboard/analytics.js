// analytics.js \u2014 the admin dashboard's Chart.js analytics. Fetches aggregate
// stats and renders three charts + four stat tiles.
//
// Colours come from the validated data-viz palette (blue #2a78d6, green
// #008300); text uses the app's navy ink. Single-hue bars mean no CVD concern;
// the one 2-slice doughnut uses validated categorical slots 1-2.
(function () {
  "use strict";

  var API = "../Controllers/dashboard/dashboard_controllers.php?action=analytics";

  // Validated palette + ink tokens.
  var BLUE = "#2a78d6";
  var GREEN = "#008300";
  var INK = "#16244f";
  var INK_MUTED = "rgba(22, 36, 79, 0.55)";
  var GRID = "rgba(22, 36, 79, 0.08)";

  if (window.Chart) {
    Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    Chart.defaults.color = INK_MUTED;
  }

  var peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

  // Draws each value at the end of its horizontal bar (the relief rule \u2014 labels
  // are visible, not colour-alone).
  var barValueLabels = {
    id: "barValueLabels",
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        chart.getDatasetMeta(di).data.forEach(function (bar, i) {
          ctx.save();
          ctx.font = '700 12px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillStyle = INK;
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.fillText(String(ds.data[i]), bar.x + 8, bar.y);
          ctx.restore();
        });
      });
    }
  };

  function horizontalBar(canvasId, rows, color) {
    var el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    return new Chart(el, {
      type: "bar",
      data: {
        labels: rows.map(function (r) { return r.label; }),
        datasets: [{
          data: rows.map(function (r) { return r.value; }),
          backgroundColor: color,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: "flex",
          maxBarThickness: 34
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        // headroom so the value label past the bar end isn't clipped
        layout: { padding: { right: 28 } },
        plugins: {
          legend: { display: false },     // single series \u2014 the title names it
          tooltip: {
            backgroundColor: INK,
            padding: 10,
            callbacks: { label: function (c) { return " " + c.parsed.x; } }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: max,
            grid: { color: GRID, drawBorder: false },
            ticks: { precision: 0, color: INK_MUTED },
            border: { display: false }
          },
          y: {
            grid: { display: false, drawBorder: false },
            ticks: { color: INK, font: { weight: "600" } },
            border: { display: false }
          }
        }
      },
      plugins: [barValueLabels]
    });
  }

  function doughnut(canvasId, rows) {
    var el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    return new Chart(el, {
      type: "doughnut",
      data: {
        labels: rows.map(function (r) { return r.label; }),
        datasets: [{
          data: rows.map(function (r) { return r.value; }),
          backgroundColor: [BLUE, GREEN],
          borderColor: "#fff",
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom", labels: { color: INK, usePointStyle: true, pointStyle: "circle", padding: 16 } },
          tooltip: { backgroundColor: INK, padding: 10 }
        }
      }
    });
  }

  function setStat(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  fetch(API, { headers: { "X-Requested-With": "XMLHttpRequest" } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.success) return;

      var t = data.totals;
      setStat("statApplicants", t.applicants);
      setStat("statEnrolled", t.enrolled);
      setStat("statStudents", t.active_students);
      setStat("statCollected", peso.format(t.collected));

      horizontalBar("chartStatus", data.applicants_status, BLUE);
      horizontalBar("chartStrand", data.enrollments_strand, GREEN);
      doughnut("chartGrade", data.students_grade);
    })
    .catch(function () {
      ["statApplicants", "statEnrolled", "statStudents", "statCollected"].forEach(function (id) { setStat(id, "\u2014"); });
    });
})();
