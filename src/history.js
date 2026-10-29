// Saved payment history (localStorage) with JSON export/import.
export const KEY = 'tq.history.v1';
const mem = new Map();
const store = () => (typeof localStorage !== 'undefined' ? localStorage : { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) });
export function load() { try { const a = JSON.parse(store().getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
export function save(list) { store().setItem(KEY, JSON.stringify(list)); return list; }
export function validate(e) {
  return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && isFinite(+e.amount) && +e.amount >= 0 && ['federal', 'state', 'deposit'].includes(e.kind);
}
export function add(e) {
  const entry = { id: e.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: e.date, amount: +(+e.amount).toFixed(2), kind: e.kind, note: String(e.note || '').slice(0, 140) };
  if (!validate(entry)) throw new Error('Invalid entry');
  return save([...load(), entry].sort((a, b) => a.date.localeCompare(b.date)));
}
export function remove(id) { return save(load().filter((e) => e.id !== id)); }
export function totals(list = load()) {
  return list.reduce((t, e) => { t[e.kind] = +(t[e.kind] + e.amount).toFixed(2); return t; }, { federal: 0, state: 0, deposit: 0 });
}
export function exportJson(list = load()) { return JSON.stringify({ app: 'taxquarterly', version: 1, exported: new Date().toISOString(), entries: list }, null, 2); }
export function importJson(text) {
  const d = JSON.parse(text); const entries = Array.isArray(d) ? d : d.entries;
  if (!Array.isArray(entries)) throw new Error('No entries found');
  const byId = new Map(load().map((e) => [e.id, e]));
  for (const e of entries) if (validate(e)) byId.set(e.id || Math.random().toString(36).slice(2), { ...e, amount: +e.amount });
  return save([...byId.values()].sort((a, b) => a.date.localeCompare(b.date)));
}
