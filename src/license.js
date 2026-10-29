// Pro license stored locally. LIMITATION: there is no backend/webhook yet, so this flag is
// set client-side after Paddle's checkout.completed event and could be forged by a
// technical user. Replace with server-side verification (webhook + API) when a backend exists.
export const KEY = 'tq.pro.v1';
const mem = new Map();
const store = () => (typeof localStorage !== 'undefined' ? localStorage : { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) });
export function get() { try { return JSON.parse(store().getItem(KEY) || 'null'); } catch { return null; } }
export const isPro = () => !!get()?.pro;
export function grantFromCheckout(data) {
  const txn = data?.transaction_id || data?.id;
  if (!txn || !/^txn_/.test(txn)) throw new Error('Missing Paddle transaction id');
  const lic = { pro: true, transactionId: txn, email: data?.customer?.email || null, priceId: data?.items?.[0]?.price_id || null, since: new Date().toISOString(), source: 'checkout' };
  store().setItem(KEY, JSON.stringify(lic)); return lic;
}
export function restore({ email, transactionId }) {
  if (!/^txn_[a-z0-9]{10,}$/i.test(transactionId || '')) throw new Error('Enter the transaction ID from your Paddle receipt (starts with txn_).');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw new Error('Enter the email used at checkout.');
  const lic = { pro: true, transactionId, email, since: new Date().toISOString(), source: 'restore-unverified' };
  store().setItem(KEY, JSON.stringify(lic)); return lic;
}
export function clear() { store().removeItem(KEY); }
