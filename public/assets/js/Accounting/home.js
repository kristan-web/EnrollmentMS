/* Controller for View/index.php: refreshes the sample total if the server is up. */

(function () {
  "use strict";

  var M = window.AccountingModel;
  var totalEl = document.querySelector(".soa__total-amount");
  if (!M || !totalEl) return;

  M.fetchFees().then(function (result) {
    if (result.offline) return;
    var total = M.money(M.totalOf(result.fees));
    if (total > 0) totalEl.textContent = M.formatPeso(total);
  }).catch(function () {
    /* Server off: keep the sample amount. */
  });
})();
