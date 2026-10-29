import { PADDLE, isConfigured } from './config.js';
import { STATES, stateTax } from './state.js';
import { buildIcs } from './ics.js';
import * as H from './history.js';
import * as L from './license.js';
import { DEADLINES } from './constants.js';
const $ = (n) => '$' + Math.round(n).toLocaleString('en-US');
const q = (id) => document.getElementById(id);
const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sel = q('state-sel');
sel.innerHTML = Object.entries(STATES).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('');
sel.value = localStorage.getItem('tq.state') || 'CA';
q('state-sources').innerHTML = Object.entries(STATES).map(([k, s]) => `<a href="${s.source}">${s.name}${s.type === 'none' ? '' : ' (' + s.year + ')'}</a>`).join(' · ');

function stateResult() {
  const t = window.__tq; if (!t) return null;
  return stateTax(sel.value, { status: t.e.status, seNet: t.e.seNet, halfSe: t.e.se.halfDeduction, w2: t.w2, other: t.other });
}
function drawState() {
  const r = stateResult(); if (!r) return; const s = STATES[sel.value];
  q('state-out').innerHTML = s.type === 'none'
    ? `<p><b>${s.name} has no state income tax</b> on freelance income — no state estimated payments needed.${s.note ? ' <i>' + s.note + '</i>' : ''}</p>`
    : `<p>Estimated ${s.name} tax: <span class="big">${$(r.tax)}</span>/yr · <b>${$(r.tax / 4)}</b> per quarter (${r.rate}% of income)</p>
       <p class="fine">Uses ${s.name}'s ${s.year} published ${s.type === 'flat' ? 'flat rate' : 'brackets'}${s.year < 2026 ? ' (2026 schedule not yet published)' : ''}. ${s.note || ''} State due dates can differ from federal. <a href="${s.source}">Source</a>.</p>`;
}
function drawHistory() {
  const list = H.load(), t = H.totals(list);
  q('hist-out').innerHTML = list.length ? `<table><tr><th>Date</th><th>Type</th><th>Amount</th><th>Note</th><th></th></tr>${list.map((e) =>
    `<tr><td>${e.date}</td><td>${e.kind}</td><td>${$(e.amount)}</td><td>${escH(e.note)}</td><td><button class="x pro-only" data-id="${e.id}" aria-label="Delete">×</button></td></tr>`).join('')}</table>
    <p>Total federal paid <b>${$(t.federal)}</b> · state paid <b>${$(t.state)}</b> · set aside <b>${$(t.deposit)}</b></p>` : '<p class="fine">No payments saved yet.</p>';
  applyLock();
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function applyLock() {
  const pro = L.isPro();
  document.querySelectorAll('.pro-only').forEach((b) => { b.disabled = !pro; });
  q('pro-badge').textContent = pro ? 'Active' : 'Locked'; q('pro-badge').classList.toggle('on', pro);
  const lic = L.get();
  q('pro-lock-msg').textContent = pro ? `Pro active on this device (transaction ${lic.transactionId}).` : 'Pro tools unlock after purchase. Previews are shown; actions are disabled until then.';
}
sel.addEventListener('change', () => { localStorage.setItem('tq.state', sel.value); drawState(); });
document.addEventListener('tq:estimate', drawState);
q('hist-form').addEventListener('submit', (ev) => { ev.preventDefault(); const f = ev.target;
  try { H.add({ date: f.date.value, amount: f.amount.value, kind: f.kind.value, note: f.note.value }); f.reset(); drawHistory(); } catch (e) { alert(e.message); } });
q('hist-out').addEventListener('click', (ev) => { const id = ev.target.dataset?.id; if (id && L.isPro()) { H.remove(id); drawHistory(); } });
q('exp-btn').onclick = () => download(`taxquarterly-backup-${new Date().toISOString().slice(0, 10)}.json`, H.exportJson(), 'application/json');
q('imp-btn').onclick = () => q('imp-file').click();
q('imp-file').onchange = async (ev) => { const file = ev.target.files[0]; if (!file) return;
  try { H.importJson(await file.text()); drawHistory(); } catch (e) { alert('Could not import: ' + e.message); } ev.target.value = ''; };
q('ics-btn').onclick = () => {
  const t = window.__tq, amounts = {};
  if (t) DEADLINES.slice(0, 4).forEach((d) => { amounts[d.q] = t.e.safeHarborQuarterly ?? t.e.currentQuarterly; });
  download('irs-estimated-tax-2026.ics', buildIcs({ amounts }), 'text/calendar');
};
q('pdf-btn').onclick = () => {
  const t = window.__tq; if (!t) return; const e = t.e, r = stateResult(), h = H.load(), tot = H.totals(h);
  q('print-summary').innerHTML = `<h1>TaxQuarterly — 2026 estimated tax summary</h1><p>Generated ${new Date().toLocaleDateString('en-US')} · Estimates only, not tax advice.</p>
  <table><tr><td>Filing status</td><td>${e.status}</td></tr><tr><td>SE net profit</td><td>${$(e.seNet)}</td></tr><tr><td>Self-employment tax</td><td>${$(e.se.seTax + e.se.addlMedicare)}</td></tr>
  <tr><td>Federal income tax</td><td>${$(e.fedIncomeTax)}</td></tr><tr><td>Total federal tax</td><td>${$(e.totalTax)}</td></tr><tr><td>Quarterly (current year)</td><td>${$(e.currentQuarterly)}</td></tr>
  <tr><td>Quarterly (safe harbor)</td><td>${e.safeHarborQuarterly !== null ? $(e.safeHarborQuarterly) : 'n/a'}</td></tr><tr><td>Set-aside</td><td>${e.setAsidePct.toFixed(1)}%</td></tr>
  <tr><td>${r.name} state tax (${STATES[r.code].year})</td><td>${$(r.tax)} / yr</td></tr></table>
  <h2>Due dates</h2><ul>${DEADLINES.slice(0, 4).map((d) => `<li>${d.q}: ${d.date}</li>`).join('')}</ul>
  <h2>Payments saved</h2>${h.length ? `<table>${h.map((x) => `<tr><td>${x.date}</td><td>${x.kind}</td><td>${$(x.amount)}</td><td>${escH(x.note)}</td></tr>`).join('')}</table>` : '<p>None.</p>'}
  <p>Federal paid ${$(tot.federal)} · State paid ${$(tot.state)} · Set aside ${$(tot.deposit)}</p><p>taxquarterly.app</p>`;
  window.print();
};
q('restore-form').addEventListener('submit', (ev) => { ev.preventDefault();
  try { L.restore({ email: ev.target.email.value.trim(), transactionId: ev.target.txn.value.trim() }); q('restore-msg').textContent = 'Pro restored on this device.'; applyLock(); }
  catch (e) { q('restore-msg').textContent = e.message; } });

// Paddle.js v2 checkout — only loaded when config placeholders are replaced.
const status = q('buy-status');
if (isConfigured()) {
  const s = document.createElement('script'); s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  s.onload = () => {
    if (PADDLE.environment === 'sandbox') window.Paddle.Environment.set('sandbox');
    window.Paddle.Initialize({ token: PADDLE.clientToken, eventCallback: (ev) => {
      if (ev.name === 'checkout.completed') { try { L.grantFromCheckout(ev.data); applyLock(); status.textContent = 'Thanks! Pro is now active on this device.'; location.hash = 'pro'; } catch (e) { status.textContent = e.message; } }
    } });
    document.querySelectorAll('.buy-btn').forEach((b) => { b.disabled = false; b.onclick = () =>
      window.Paddle.Checkout.open({ items: [{ priceId: PADDLE.prices[b.dataset.plan], quantity: 1 }], settings: { displayMode: 'overlay', theme: 'light', successUrl: location.origin + location.pathname + '#pro' } }); });
    status.textContent = 'Secure checkout by Paddle.';
  };
  document.head.appendChild(s);
} else status.textContent = 'Checkout opens soon.';
drawHistory(); drawState(); applyLock();
