import type { Handle } from '@sveltejs/kit';
import { proxyGameRequest } from '$lib/server/game-proxy';

export const handle: Handle = async ({ event, resolve }) => {
	// request.url שומר גם את סיומת __data.json וה-query המקוריים של המשחק.
	return (await proxyGameRequest(event.request)) ?? resolve(event);
};
