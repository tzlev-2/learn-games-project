// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('learn-booster-kit', () => ({ boosterService: { init: service.init } }));

it('shares the pending initialization between layout and demo and reuses its completed promise', async () => {
	let complete!: () => void;
	const pending = new Promise<void>((resolve) => {
		complete = resolve;
	});
	service.init.mockReturnValue(pending);
	const { initializeBooster } = await import('../../../apps/kit-test-screen/src/lib/booster-init');
	const layout = initializeBooster();
	const demo = initializeBooster();
	expect(layout).toBe(pending);
	expect(demo).toBe(layout);
	expect(service.init).toHaveBeenCalledTimes(1);
	complete();
	await Promise.all([layout, demo]);
	expect(initializeBooster()).toBe(layout);
	expect(service.init).toHaveBeenCalledTimes(1);
});
