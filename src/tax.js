import * as C from './constants.js';
const r2 = (x) => Math.round(x * 100) / 100;

export function incomeTax(taxable, status) {
  let tax = 0, lower = 0;
  for (const [upper, rate] of C.BRACKETS[status]) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  return r2(tax);
}

export function seTax(seNet, status, w2Wages = 0) {
  const base = Math.max(0, seNet) * C.SE_FACTOR;
  if (base < 400) return { seTax: 0, ss: 0, medicare: 0, addlMedicare: 0, halfDeduction: 0 };
  const ssRoom = Math.max(0, C.SS_WAGE_BASE - w2Wages);
  const ss = Math.min(base, ssRoom) * C.SS_RATE;
  const medicare = base * C.MEDICARE_RATE;
  const thr = Math.max(0, C.ADDL_MEDICARE_THRESHOLD[status] - w2Wages);
  const addlMedicare = Math.max(0, base - thr) * C.ADDL_MEDICARE_RATE;
  const se = ss + medicare;
  return { seTax: r2(se), ss: r2(ss), medicare: r2(medicare), addlMedicare: r2(addlMedicare), halfDeduction: r2(se / 2) };
}

/** inputs: status, seIncome (number or array of periods), otherIncome, w2Wages, withholding,
 *  priorYearTax, priorYearAgi, useQbi, paidSoFar */
export function estimate(inp) {
  const status = inp.status || 'single';
  const periods = Array.isArray(inp.seIncome) ? inp.seIncome : [inp.seIncome || 0];
  const seNet = periods.reduce((a, b) => a + (+b || 0), 0);
  const other = +inp.otherIncome || 0, w2 = +inp.w2Wages || 0;
  const se = seTax(seNet, status, w2);
  const agi = Math.max(0, seNet + other + w2 - se.halfDeduction);
  const std = C.STANDARD_DEDUCTION[status];
  const preQbi = Math.max(0, agi - std);
  let qbi = 0, qbiNote = null;
  if (inp.useQbi && seNet > 0) {
    if (preQbi <= C.QBI_THRESHOLD[status]) qbi = r2(Math.min(0.2 * (seNet - se.halfDeduction), 0.2 * preQbi));
    else qbiNote = 'Income is above the QBI threshold; limits may apply, so QBI deduction was not included.';
  }
  const taxable = Math.max(0, preQbi - qbi);
  const fedIncomeTax = incomeTax(taxable, status);
  const totalTax = r2(fedIncomeTax + se.seTax + se.addlMedicare);
  const withholding = +inp.withholding || 0;
  const owedViaEstimates = Math.max(0, r2(totalTax - withholding));

  const prior = +inp.priorYearTax;
  const hasPrior = inp.priorYearTax !== undefined && inp.priorYearTax !== '' && !isNaN(prior);
  const pct = hasPrior && (+inp.priorYearAgi || 0) > C.SAFE_HARBOR_HIGH_AGI[status] ? 1.10 : 1.00;
  const priorReq = hasPrior ? r2(prior * pct) : null;
  const currentReq = r2(totalTax * 0.90);
  const required = priorReq === null ? currentReq : Math.min(priorReq, currentReq);
  const requiredViaEstimates = Math.max(0, r2(required - withholding));
  const safeHarborQuarterly = hasPrior ? r2(Math.max(0, priorReq - withholding) / 4) : null;
  const setAsidePct = seNet > 0 ? r2((owedViaEstimates / seNet) * 100) : 0;
  return {
    status, seNet, agi: r2(agi), standardDeduction: std, qbiDeduction: qbi, qbiNote, taxableIncome: r2(taxable),
    fedIncomeTax, se, totalTax, withholding, owedViaEstimates,
    safeHarborPct: hasPrior ? Math.round(pct * 100) : null, priorYearRequired: priorReq, currentYear90: currentReq,
    requiredAnnual: required, requiredViaEstimates, safeHarborQuarterly,
    currentQuarterly: r2(owedViaEstimates / 4), setAsidePct,
    periodSetAside: periods.map((p) => r2((+p || 0) * setAsidePct / 100)),
    effectiveRate: seNet + other + w2 > 0 ? r2(totalTax / (seNet + other + w2) * 100) : 0,
  };
}

export function nextDeadlines(today = new Date(), n = 3) {
  const iso = today.toISOString().slice(0, 10);
  return C.DEADLINES.filter((d) => d.date >= iso).slice(0, n);
}
