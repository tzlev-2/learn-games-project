import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getGameUpstream, proxyGameRequest } from '../src/lib/server/game-proxy';

const publicOrigin = 'https://integration.learn-games.pages.dev';
const upstreamOrigin = 'https://lg-passcode.pages.dev';

describe('בחירת יעד המשחק', () => {
	it('מנתב כל אחד מששת המשחקים ליעד הייעודי', () => {
		for (const slug of ['passcode', 'find-letter', 'lotto', 'sort-cards', 'train-addition', 'wordys']) {
			const path = `/games/${slug}/settings/__data.json?x=1`;
			assert.equal(getGameUpstream(new URL(path, publicOrigin))?.href, `https://lg-${slug}.pages.dev${path}`);
		}
	});

	it('מעביר רק את passcode ושומר נתיב, קידוד, שאילתה ולוכסן', () => {
		for (const path of [
			'/games/passcode',
			'/games/passcode/',
			'/games/passcode/settings?tab=hint&tab=voice',
			'/games/passcode/_app/immutable/entry/start.js?v=1',
			'/games/passcode/settings/__data.json?x-sveltekit-invalidated=01&x=%2F+a',
			'/games/passcode/files/%D7%90.svg?name=%26',
			'/games/passcode//example.com/path'
		]) {
			assert.equal(getGameUpstream(new URL(path, publicOrigin))?.href, upstreamOrigin + path);
		}
	});

	it('משאיר את השורש, משחקים לא מורשים ושמות דומים מחוץ לרשימה המותרת', () => {
		for (const path of [
			'/',
			'/settings',
			'/profiles',
			'/_app/immutable/entry/start.js',
			'/games',
			'/games/unknown/',
			'/games/passcode-other/',
			'/games/passcode.pages.dev/',
			'/games/%70asscode/',
			'/games/passcode%2Fsettings',
			'/games/constructor/',
			'/games/__proto__/'
		]) {
			assert.equal(getGameUpstream(new URL(path, publicOrigin)), null);
		}
	});
});

describe('תיווך בקשות ותשובות', () => {
	it('לא מבצע fetch עבור כתובת שאינה מורשית', async () => {
		const result = await proxyGameRequest(new Request(publicOrigin + '/games/unknown/'), async () => {
			assert.fail('unexpected upstream request');
		});
		assert.equal(result, null);
	});

	it('שומר שיטה, גוף בינארי וכותרות, ומתרגם Origin של אותו מקור', async () => {
		const body = new Uint8Array([0, 1, 127, 255]);
		const request = new Request(publicOrigin + '/games/passcode/settings?/save&x=%2F', {
			method: 'POST',
			body,
			headers: {
				'content-type': 'application/octet-stream',
				origin: publicOrigin,
				cookie: 'session=test',
				range: 'bytes=0-3',
				'x-forwarded-host': 'forged.example'
			}
		});
		const response = await proxyGameRequest(request, async (forwarded) => {
			assert.equal(forwarded.url, upstreamOrigin + '/games/passcode/settings?/save&x=%2F');
			assert.equal(forwarded.method, 'POST');
			assert.equal(forwarded.redirect, 'manual');
			assert.deepEqual(new Uint8Array(await forwarded.arrayBuffer()), body);
			assert.equal(forwarded.headers.get('content-type'), 'application/octet-stream');
			assert.equal(forwarded.headers.get('cookie'), 'session=test');
			assert.equal(forwarded.headers.get('range'), 'bytes=0-3');
			assert.equal(forwarded.headers.get('origin'), upstreamOrigin);
			assert.equal(forwarded.headers.get('x-forwarded-host'), new URL(publicOrigin).host);
			assert.equal(forwarded.headers.get('x-forwarded-proto'), 'https');
			return new Response(body, {
				status: 206,
				statusText: 'Partial Content',
				headers: {
					'content-type': 'application/octet-stream',
					'content-range': 'bytes 0-3/8',
					'cache-control': 'public, max-age=3600',
					etag: '"test"',
					'set-cookie': 'session=test; Path=/games/passcode; HttpOnly'
				}
			});
		});
		assert.ok(response);
		assert.equal(response.status, 206);
		assert.equal(response.statusText, 'Partial Content');
		assert.equal(response.headers.get('content-range'), 'bytes 0-3/8');
		assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
		assert.equal(response.headers.get('etag'), '"test"');
		assert.equal(
			response.headers.get('set-cookie'),
			'session=test; Path=/games/passcode; HttpOnly'
		);
		assert.deepEqual(new Uint8Array(await response.arrayBuffer()), body);
	});

	it('משמר Origin חיצוני כדי לא לעקוף את בדיקת CSRF של המשחק', async () => {
		const response = await proxyGameRequest(
			new Request(publicOrigin + '/games/passcode/settings', {
				method: 'POST',
				body: 'x=1',
				headers: { origin: 'https://external.example' }
			}),
			async (request) => {
				assert.equal(request.headers.get('origin'), 'https://external.example');
				return new Response(null, { status: 403 });
			}
		);
		assert.equal(response?.status, 403);
	});

	it('מעביר HEAD וכותרות תנאי, וטוען תשובת 304 ללא גוף', async () => {
		const response = await proxyGameRequest(
			new Request(publicOrigin + '/games/passcode/_app/version.json', {
				method: 'HEAD',
				headers: { 'if-none-match': '"version"' }
			}),
			async (request) => {
				assert.equal(request.method, 'HEAD');
				assert.equal(request.headers.get('if-none-match'), '"version"');
				return new Response(null, { status: 304, headers: { etag: '"version"' } });
			}
		);
		assert.equal(response?.status, 304);
		assert.equal(response?.body, null);
		assert.equal(response?.headers.get('etag'), '"version"');
	});

	it('מחזיר 404 של נכס מהמשחק בלי להחליף אותו בדף הפורטל', async () => {
		const response = await proxyGameRequest(
			new Request(publicOrigin + '/games/passcode/missing.svg'),
			async () => new Response('missing asset', { status: 404 })
		);
		assert.equal(response?.status, 404);
		assert.equal(await response?.text(), 'missing asset');
	});

	it('מחזיר הפניות לדומיין הציבורי, בלי לעקוב אחריהן בשרת', async () => {
		for (const location of [
			upstreamOrigin + '/games/passcode/?from=settings#hint',
			'/games/passcode/?from=settings#hint',
			'./?from=settings#hint'
		]) {
			const response = await proxyGameRequest(
				new Request(publicOrigin + '/games/passcode/settings'),
				async (request) => {
					assert.equal(request.redirect, 'manual');
					return new Response(null, {
						status: 308,
						headers: { location, 'x-sveltekit-normalize': '1' }
					});
				}
			);
			assert.equal(response?.status, 308);
			assert.equal(response?.headers.get('x-sveltekit-normalize'), '1');
			assert.equal(
				response?.headers.get('location'),
				publicOrigin + '/games/passcode/?from=settings#hint'
			);
		}
	});

	it('משמר הפניה חיצונית בלי לבצע אליה בקשה', async () => {
		const location = 'https://external.example/login?next=game';
		const response = await proxyGameRequest(
			new Request(publicOrigin + '/games/passcode/'),
			async () => new Response(null, { status: 302, headers: { location } })
		);
		assert.equal(response?.headers.get('location'), location);
	});

	it('משמר גם כותרת הפניה פגומה שהגיעה משרת המשחק', async () => {
		const response = await proxyGameRequest(
			new Request(publicOrigin + '/games/passcode/'),
			async () => new Response(null, { status: 302, headers: { location: 'http://[' } })
		);
		assert.equal(response?.status, 302);
		assert.equal(response?.headers.get('location'), 'http://[');
	});
});
