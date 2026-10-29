import { estimate, nextDeadlines } from './tax.js';
const f = document.getElementById('f'), out = document.getElementById('out'), periods = document.getElementById('periods');
const $ = (n) => '$' + Math.round(n).toLocaleString('en-US');
const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function drawPeriods() {
  const mode = f.mode.value, labels = mode === 'annual' ? ['Full year'] : mode === 'quarterly' ? ['Q1','Q2','Q3','Q4'] : M;
  const def = mode === 'annual' ? 60000 : mode === 'quarterly' ? 15000 : 5000;
  periods.innerHTML = labels.map((l) => `<label>${l} <input class="p" type="number" min="0" value="${def}"></label>`).join('');
}
function render() {
  const p = [...periods.querySelectorAll('.p')].map((i) => +i.value || 0);
  const e = estimate({ status: f.status.value, seIncome: p, useQbi: f.useQbi.checked, w2Wages: f.w2Wages.value,
    otherIncome: f.otherIncome.value, withholding: f.withholding.value, priorYearTax: f.priorYearTax.value, priorYearAgi: f.priorYearAgi.value });
  const dl = nextDeadlines(new Date()).map((d) => `<li><b>${d.q}</b> due ${new Date(d.date + 'T12:00').toDateString()}${d.unconfirmed ? ' (expected; IRS not yet published)' : ''}</li>`).join('');
  const sh = e.safeHarborQuarterly !== null
    ? `<p>Safe harbor: pay <span class="big">${$(e.safeHarborQuarterly)}</span> per quarter (${e.safeHarborPct}% of last year's tax${e.withholding ? ', minus withholding' : ''}). Paying this on time avoids the IRS underpayment penalty even if you earn more this year.</p>`
    : `<p>Enter last year's total tax and AGI to see your penalty-proof <b>safe harbor</b> amount.</p>`;
  window.__tq = { e, w2: +f.w2Wages.value || 0, other: +f.otherIncome.value || 0 }; document.dispatchEvent(new CustomEvent('tq:estimate'));
  out.innerHTML = `<h2>Your 2026 estimate</h2>${sh}
  <p>Based on this year's projected income: <b>${$(e.currentQuarterly)}</b> per quarter (${$(e.owedViaEstimates)} for the year).</p>
  <p>Set aside about <span class="big">${e.setAsidePct.toFixed(1)}%</span> of every freelance payment you receive.</p>
  ${p.length > 1 ? '<p>Per period set-aside: ' + e.periodSetAside.map($).join(' · ') + '</p>' : ''}
  <table><tr><td>Self-employment tax</td><td>${$(e.se.seTax + e.se.addlMedicare)}</td></tr><tr><td>Federal income tax</td><td>${$(e.fedIncomeTax)}</td></tr>
  <tr><td>Total federal tax</td><td><b>${$(e.totalTax)}</b> (${e.effectiveRate}% of income)</td></tr><tr><td>Taxable income</td><td>${$(e.taxableIncome)}</td></tr></table>
  ${e.qbiNote ? `<p><i>${e.qbiNote}</i></p>` : ''}
  <h3>Next IRS deadlines</h3><ul>${dl}</ul>
  <h3>In plain English</h3><p>As a freelancer nobody withholds tax for you, so the IRS expects four payments a year. You owe two taxes:
  <b>self-employment tax</b> (15.3% on 92.35% of your profit, the Social Security part stops at $184,500) and <b>income tax</b> on what's left after half of the SE tax and the ${$(e.standardDeduction)} standard deduction${e.qbiDeduction ? ` and a ${$(e.qbiDeduction)} QBI deduction` : ''}.
  To avoid penalties you only need to pay the smaller of 90% of this year's tax or ${e.safeHarborPct ?? '100'}% of last year's — that's the safe harbor. Paying the safe harbor amount is the "can't go wrong" option; any remainder is due by April 15, 2027.</p>`;
}
f.addEventListener('input', (ev) => { if (ev.target.name === 'mode') drawPeriods(); render(); });
drawPeriods(); render();
