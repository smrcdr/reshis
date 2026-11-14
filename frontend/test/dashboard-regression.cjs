const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const assert = require('node:assert/strict');
const os = require('node:os');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reshis-test-'));
const bundlePath = path.join(tempDir, 'dashboard.cjs');
const rootPath = path.resolve(__dirname, '..');
const { build } = require(rootPath + '/node_modules/esbuild');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost:3107/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement', 'Event', 'MouseEvent', 'HTMLInputElement'])
    global[k] = dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT = true;
global.ResizeObserver = class {
    observe() { }
    disconnect() { }
};
const React = require(rootPath + '/node_modules/react');
const { createRoot } = require(rootPath + '/node_modules/react-dom/client');
const { act } = React;
const route = { code: 'MOW-AER', name: 'Москва — Сочи', origin: { code: 'MOW', city: 'Москва' }, destination: { code: 'AER', city: 'Сочи' }, basePrice: 9000, priceMin: 5400, priceMax: 18000, priceSensitivity: 0.141, costPerPassenger: 4200 };
let delayNext = false, pending = [];
const makeResult = (price) => { const quantiles = Array.from({ length: 9 }, (_, i) => { const baseDemand = 768 + i * 16; const wish = baseDemand - .141 * (price - 9000); return { q: (i + 1) / 10, baseDemand, wish, buy: Math.floor(Math.max(0, Math.min(900, wish))), capped: wish >= 900 }; }); return { route: route.code, routeName: route.name, date: '2026-06-01', price, seats: 900, wish: quantiles[4].wish, buy: quantiles[4].buy, soldOut: false, loadFactor: quantiles[4].buy / 900, quantiles, warnings: [] }; };
global.__auditApi = { GET: async (p) => ({ data: p === '/routes' ? [route] : { route: route.code, dates: ['2026-06-01', '2026-06-02'] } }), POST: async (p, { body }) => { if (delayNext) {
        delayNext = false;
        return new Promise(resolve => pending.push(() => resolve({ data: makeResult(body.price), response: { status: 200 } })));
    } return { data: makeResult(body.price), response: { status: 200 } }; } };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function inputValue(v) { const input = document.getElementById('price'); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, v); input.dispatchEvent(new window.Event('input', { bubbles: true })); input.dispatchEvent(new window.Event('change', { bubbles: true })); }
function snapshot() { return { priceInput: document.getElementById('price').value, busy: document.querySelector('.results').getAttribute('aria-busy'), stale: !!document.querySelector('.is-stale'), resultText: document.querySelector('.tile:nth-child(2) .muted')?.textContent, formError: document.querySelector('.form-card [role="alert"]')?.textContent ?? null }; }
(async () => {
    await build({ entryPoints: [rootPath + '/src/forecast/Dashboard.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile: bundlePath, packages: 'external', nodePaths: [path.join(rootPath, 'node_modules')], jsx: 'automatic', plugins: [{ name: 'audit-api', setup(build) { build.onResolve({ filter: /api\/client$/ }, () => ({ path: 'audit-api', namespace: 'audit' })); build.onLoad({ filter: /.*/, namespace: 'audit' }, () => ({ contents: 'export const api=globalThis.__auditApi; export const NETWORK_ERROR="network"; export const errorText=()=>"api error";', loader: 'js' })); } }] });
    const Module = require('node:module');
    process.env.NODE_PATH = path.join(rootPath, 'node_modules');
    Module._initPaths();
    const { Dashboard } = require(bundlePath);
    const root = createRoot(document.getElementById('root'));
    const user = { id: 'audit', email: 'audit@reshis.test', name: 'Audit', createdAt: '2026-11-14' };
    const onLogout = () => { };
    const mount = async () => { await act(async () => { root.render(React.createElement(Dashboard, { user, onLogout })); }); await act(async () => { await wait(300); }); };
    await mount();
    const initial = snapshot();
    await act(async () => { inputValue('10000'); });
    const pendingBeforeClear = snapshot();
    await act(async () => { inputValue(''); });
    await act(async () => { await wait(350); });
    const clearedBeforeDebounce = snapshot();
    await act(async () => { inputValue('10000'); });
    await act(async () => { await wait(300); });
    delayNext = true;
    await act(async () => { inputValue('11000'); });
    await act(async () => { await wait(300); });
    const pendingRequestCount = pending.length;
    await act(async () => { inputValue(''); });
    const beforeStaleResponse = snapshot();
    await act(async () => { for (const resolve of pending)
        resolve(); pending = []; });
    const afterStaleResponse = snapshot();
    const output = { initial, pendingBeforeClear, clearedBeforeDebounce, pendingRequestCount, beforeStaleResponse, afterStaleResponse };
    assert.equal(clearedBeforeDebounce.busy, 'false');
    assert.equal(clearedBeforeDebounce.resultText, undefined);
    assert.equal(afterStaleResponse.busy, 'false');
    assert.equal(afterStaleResponse.resultText, undefined);
    console.log(JSON.stringify(output, null, 2));
    await act(async () => root.unmount());
    fs.rmSync(tempDir, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exitCode = 1; });
