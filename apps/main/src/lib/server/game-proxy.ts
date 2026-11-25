const GAME_UPSTREAMS: Readonly<Record<string, string>> = Object.freeze({
	passcode: 'https://lg-passcode.pages.dev'
});

type UpstreamFetch = (request: Request) => Promise<Response>;

/** מחזיר יעד מורשה בלבד, עם הנתיב והשאילתה המקוריים של הבקשה. */
export function getGameUpstream(requestUrl: URL): URL | null {
	const slug = /^\/games\/([^/]+)(?:\/|$)/.exec(requestUrl.pathname)?.[1];
	if (!slug || !Object.hasOwn(GAME_UPSTREAMS, slug)) return null;

	const upstream = new URL(GAME_UPSTREAMS[slug]);
	const target = new URL(requestUrl);
	target.protocol = upstream.protocol;
	target.host = upstream.host;
	return target;
}

/** מתווך בקשת משחק בלי לעקוב אחרי הפניות או לשנות את גוף התשובה. */
export async function proxyGameRequest(
	request: Request,
	fetchUpstream: UpstreamFetch = fetch
): Promise<Response | null> {
	const publicUrl = new URL(request.url);
	const upstreamUrl = getGameUpstream(publicUrl);
	if (!upstreamUrl) return null;

	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.set('x-forwarded-host', publicUrl.host);
	headers.set('x-forwarded-proto', publicUrl.protocol.slice(0, -1));
	// בקשת טופס מאותו מקור נשארת מאותו מקור גם בבדיקת CSRF של המשחק.
	if (headers.get('origin') === publicUrl.origin) {
		headers.set('origin', upstreamUrl.origin);
	}

	try {
		const upstreamRequest = new Request(new Request(upstreamUrl, request), {
			headers,
			redirect: 'manual'
		});
		const upstreamResponse = await fetchUpstream(upstreamRequest);
		const responseHeaders = new Headers(upstreamResponse.headers);
		const location = responseHeaders.get('location');
		if (location) {
			try {
				const redirectUrl = new URL(location, upstreamUrl);
				if (redirectUrl.origin === upstreamUrl.origin) {
					redirectUrl.protocol = publicUrl.protocol;
					redirectUrl.host = publicUrl.host;
					responseHeaders.set('location', redirectUrl.href);
				}
			} catch {
				// כותרת Location לא תקינה נשמרת כפי שהתקבלה משרת המשחק.
			}
		}

		return new Response(upstreamResponse.body, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('Game upstream request failed', error);
		return new Response(null, { status: 502, headers: { 'cache-control': 'no-store' } });
	}
}
