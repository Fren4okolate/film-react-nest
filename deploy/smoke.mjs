import assert from 'node:assert/strict';

const baseUrl = process.argv[2] ?? 'http://localhost';
const get = (path) => fetch(new URL(path, baseUrl));

const indexResponse = await get('/');
assert.equal(indexResponse.status, 200, 'frontend responds');
const index = await indexResponse.text();
assert.match(index, /id="root"/, 'React root is served');
const asset = index.match(/src="([^\"]+\.js)"/)?.[1];
assert.ok(asset, 'built JavaScript asset exists');
assert.equal((await get(asset)).status, 200, 'JavaScript asset is served');
assert.equal(await (await get('/nested/spa/route')).text(), index, 'SPA fallback works');
assert.equal((await get('/assets/missing.js')).status, 404, 'missing assets do not return HTML');

const filmsResponse = await get('/api/afisha/films');
assert.equal(filmsResponse.status, 200, 'nginx proxies the API');
const films = await filmsResponse.json();
assert.equal(films.total, 6, 'all seed films are loaded');
assert.ok(films.items.every((film) => Array.isArray(film.tags)), 'tags are arrays');
const film = films.items[0];
assert.equal((await get(`/content/afisha${film.image}`)).status, 200, 'posters are served');
const schedulesResponse = await get(`/api/afisha/films/${film.id}/schedule`);
assert.equal(schedulesResponse.status, 200);
const schedules = await schedulesResponse.json();
assert.ok(schedules.items.length > 0, 'seed schedules are loaded');
assert.ok(schedules.items.every((schedule) => Array.isArray(schedule.taken)));
const invalidOrder = await fetch(new URL('/api/afisha/order', baseUrl), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tickets: [] }),
});
assert.equal(invalidOrder.status, 409, 'order endpoint validates empty orders');
console.log('PASS: frontend, assets, SPA routing, API, posters, seed data and order validation');
