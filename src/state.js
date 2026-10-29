// State income tax estimates (approximation). Figures are the latest PUBLISHED rate
// schedules as of 2026-10-29; the year each one is from is in `year`.
// Base used: federal AGI (SE profit - 1/2 SE tax + wages + other income) minus the state's
// standard deduction / personal exemption. Credits, local/city taxes (e.g. NYC), NY
// high-income recapture and state-specific adjustments are NOT modelled.
const r2 = (x) => Math.round(x * 100) / 100;
const dbl = (b) => b.map(([u, r]) => [u === Infinity ? Infinity : u * 2, r]);
const CA_S = [[11079,.01],[26264,.02],[41452,.04],[57542,.06],[72724,.08],[371479,.093],[445771,.103],[742953,.113],[Infinity,.123]];
const NY_S = [[8500,.04],[11700,.045],[13900,.0525],[80650,.055],[215400,.06],[1077550,.0685],[5000000,.0965],[25000000,.103],[Infinity,.109]];
const NY_J = [[17150,.04],[23600,.045],[27900,.0525],[161550,.055],[323200,.06],[2155350,.0685],[5000000,.0965],[25000000,.103],[Infinity,.109]];
const NY_H = [[12800,.04],[17650,.045],[20900,.0525],[107650,.055],[269300,.06],[1616450,.0685],[5000000,.0965],[25000000,.103],[Infinity,.109]];
const NJ_S = [[20000,.014],[35000,.0175],[40000,.035],[75000,.05525],[500000,.0637],[1000000,.0897],[Infinity,.1075]];
const NJ_J = [[20000,.014],[50000,.0175],[70000,.0245],[80000,.035],[150000,.05525],[500000,.0637],[1000000,.0897],[Infinity,.1075]];
const flat = (r) => [[Infinity, r]];
const none = { type: 'none', year: 'n/a' };
export const STATES = {
  CA: { name: 'California', year: 2025, type: 'brackets', brackets: { single: CA_S, mfj: dbl(CA_S), mfs: CA_S, hoh: CA_S },
        deduction: { single: 5706, mfj: 11412, mfs: 5706, hoh: 11412 }, surtax: { over: 1000000, rate: .01 },
        note: 'Includes 1% Mental Health Services Tax over $1M. HoH uses single brackets (simplified).',
        source: 'https://www.ftb.ca.gov/forms/2025/2025-540-tax-rate-schedules.pdf' },
  NY: { name: 'New York', year: 2025, type: 'brackets', brackets: { single: NY_S, mfj: NY_J, mfs: NY_S, hoh: NY_H },
        deduction: { single: 8000, mfj: 16050, mfs: 8000, hoh: 11200 },
        note: 'State only; NYC/Yonkers tax and high-income benefit recapture not included.',
        source: 'https://www.tax.ny.gov/pit/file/tax-tables/' },
  NJ: { name: 'New Jersey', year: 2025, type: 'brackets', brackets: { single: NJ_S, mfj: NJ_J, mfs: NJ_S, hoh: NJ_J },
        deduction: { single: 1000, mfj: 2000, mfs: 1000, hoh: 1000 }, note: 'Personal exemption only.',
        source: 'https://www.nj.gov/treasury/taxation/taxtables.shtml' },
  IL: { name: 'Illinois', year: 2025, type: 'flat', brackets: { single: flat(.0495) }, deduction: { single: 2850, mfj: 5700, mfs: 2850, hoh: 2850 },
        source: 'https://tax.illinois.gov/research/taxrates/income.html' },
  PA: { name: 'Pennsylvania', year: 2025, type: 'flat', brackets: { single: flat(.0307) }, deduction: { single: 0, mfj: 0, mfs: 0, hoh: 0 },
        note: 'PA taxes business profit without the 1/2 SE-tax deduction; local EIT not included.', noHalfSe: true,
        source: 'https://www.revenue.pa.gov/TaxTypes/PIT/Pages/default.aspx' },
  GA: { name: 'Georgia', year: 2026, type: 'flat', brackets: { single: flat(.0499) }, deduction: { single: 15000, mfj: 30000, mfs: 15000, hoh: 15000 },
        source: 'https://dor.georgia.gov/taxes/individual-taxes' },
  NC: { name: 'North Carolina', year: 2026, type: 'flat', brackets: { single: flat(.0399) }, deduction: { single: 12750, mfj: 25500, mfs: 12750, hoh: 19125 },
        source: 'https://www.ncdor.gov/taxes-forms/individual-income-tax' },
  MA: { name: 'Massachusetts', year: 2025, type: 'flat', brackets: { single: flat(.05) }, deduction: { single: 4400, mfj: 8800, mfs: 4400, hoh: 6800 },
        surtax: { over: 1083150, rate: .04 }, note: 'Includes 4% surtax on income over $1,083,150 (2025).',
        source: 'https://www.mass.gov/info-details/massachusetts-tax-rates' },
  TX: { name: 'Texas', ...none, source: 'https://comptroller.texas.gov/taxes/' },
  FL: { name: 'Florida', ...none, source: 'https://floridarevenue.com/taxes/taxesfees/Pages/default.aspx' },
  WA: { name: 'Washington', ...none, note: 'No wage/business income tax (7% capital-gains tax not modelled).', source: 'https://dor.wa.gov/taxes-rates/income-tax' },
};
export function stateTax(code, { status = 'single', seNet = 0, halfSe = 0, w2 = 0, other = 0 } = {}) {
  const s = STATES[code];
  if (!s) throw new Error('Unknown state ' + code);
  if (s.type === 'none') return { code, name: s.name, tax: 0, taxable: 0, rate: 0, year: s.year };
  const base = Math.max(0, seNet + w2 + other - (s.noHalfSe ? 0 : halfSe));
  const taxable = Math.max(0, base - (s.deduction[status] ?? s.deduction.single));
  const br = s.brackets[status] || s.brackets.single;
  let tax = 0, lower = 0;
  for (const [upper, rate] of br) { if (taxable <= lower) break; tax += (Math.min(taxable, upper) - lower) * rate; lower = upper; }
  if (s.surtax && taxable > s.surtax.over) tax += (taxable - s.surtax.over) * s.surtax.rate;
  return { code, name: s.name, tax: r2(tax), taxable: r2(taxable), rate: base > 0 ? r2(tax / base * 100) : 0, year: s.year };
}
