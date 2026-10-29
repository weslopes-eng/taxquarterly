// RFC 5545 calendar with all-day events for each 1040-ES due date and two alarms (7 days, 1 day before).
import { DEADLINES } from './constants.js';
const fold = (l) => { const out = []; while (l.length > 75) { out.push(l.slice(0, 75)); l = ' ' + l.slice(75); } out.push(l); return out.join('\r\n'); };
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const ymd = (iso) => iso.replace(/-/g, '');
const nextDay = (iso) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
export function buildIcs({ deadlines = DEADLINES.slice(0, 4), amounts = {}, now = new Date() } = {}) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TaxQuarterly//Estimated Tax Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:IRS estimated tax (1040-ES)'];
  for (const d of deadlines) {
    const amt = amounts[d.q] ? ` Planned payment: $${Math.round(amounts[d.q]).toLocaleString('en-US')}.` : '';
    L.push('BEGIN:VEVENT', `UID:${ymd(d.date)}-${d.q.replace(/\s/g, '')}@taxquarterly.app`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d.date)}`, `DTEND;VALUE=DATE:${ymd(nextDay(d.date))}`,
      `SUMMARY:${esc(`IRS estimated tax due — ${d.q} (Form 1040-ES)`)}`,
      `DESCRIPTION:${esc(`Covers income ${d.covers}.${amt}${d.unconfirmed ? ' Date expected; not yet confirmed by IRS.' : ''} Pay at https://www.irs.gov/payments. Estimates only, not tax advice.`)}`,
      'URL:https://taxquarterly.app/', 'TRANSP:TRANSPARENT');
    for (const [days, label] of [[7, '7 days'], [1, '1 day']])
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`IRS estimated tax (${d.q}) due in ${label}`)}`, `TRIGGER:-P${days}D`, 'END:VALARM');
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}
