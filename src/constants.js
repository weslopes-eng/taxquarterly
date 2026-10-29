// Tax year 2026 constants. All figures verified 2026-10-29 against official sources.
// - Brackets, standard deduction, QBI thresholds: IRS Rev. Proc. 2025-32 (sec. 4.01, 4.26)
//   https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
//   https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
// - SS wage base $184,500 / SE rates 12.4% + 2.9%: SSA 2026 COLA fact sheet
//   https://www.ssa.gov/news/en/cola/factsheets/2026.html  (Federal Register 2025-19763)
// - SE tax mechanics (92.35%, half deduction), Additional Medicare 0.9%: IRS Schedule SE / Form 8959
//   https://www.irs.gov/forms-pubs/about-schedule-se-form-1040  https://www.irs.gov/taxtopics/tc560
// - Safe harbor 90% / 100% / 110% (AGI > $150k, $75k MFS) and due dates: Form 1040-ES (2026)
//   https://www.irs.gov/pub/irs-pdf/f1040es.pdf  https://www.irs.gov/faqs/estimated-tax
export const TAX_YEAR = 2026;
export const SOURCES = {
  brackets: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf',
  ssWageBase: 'https://www.ssa.gov/news/en/cola/factsheets/2026.html',
  safeHarbor: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf',
};
// [upper bound of bracket, rate]
export const BRACKETS = {
  single: [[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]],
  mfj:    [[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]],
  mfs:    [[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[384350,.35],[Infinity,.37]],
  hoh:    [[17700,.10],[67450,.12],[105700,.22],[201750,.24],[256200,.32],[640600,.35],[Infinity,.37]],
};
export const STANDARD_DEDUCTION = { single: 16100, mfj: 32200, mfs: 16100, hoh: 24150 };
export const SS_WAGE_BASE = 184500;
export const SS_RATE = 0.124, MEDICARE_RATE = 0.029, SE_FACTOR = 0.9235;
export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD = { single: 200000, hoh: 200000, mfj: 250000, mfs: 125000 }; // not indexed
export const QBI_THRESHOLD = { single: 201750, hoh: 201750, mfj: 403500, mfs: 201775 };
export const SAFE_HARBOR_HIGH_AGI = { single: 150000, hoh: 150000, mfj: 150000, mfs: 75000 };
// Federal 1040-ES due dates for TY2026 (Form 1040-ES 2026). 2027 dates are the statutory
// pattern (Apr 15 / Jun 15 / Sep 15 / Jan 15) — not yet confirmed by IRS publication.
export const DEADLINES = [
  { q: 'Q1 2026', date: '2026-04-15', covers: 'Jan 1 – Mar 31' },
  { q: 'Q2 2026', date: '2026-06-15', covers: 'Apr 1 – May 31' },
  { q: 'Q3 2026', date: '2026-09-15', covers: 'Jun 1 – Aug 31' },
  { q: 'Q4 2026', date: '2027-01-15', covers: 'Sep 1 – Dec 31' },
  { q: 'Q1 2027', date: '2027-04-15', covers: 'Jan 1 – Mar 31', unconfirmed: true },
  { q: 'Q2 2027', date: '2027-06-15', covers: 'Apr 1 – May 31', unconfirmed: true },
];
