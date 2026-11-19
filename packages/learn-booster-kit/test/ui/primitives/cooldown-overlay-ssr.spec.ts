/** בדיקות SSR (node) ל-props התוספתיים של CooldownOverlay. */
import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import CooldownOverlay from '../../../src/ui/primitives/CooldownOverlay.svelte';

describe('CooldownOverlay (SSR)', () => {
	const active = () => ({ untilTs: Date.now() + 5000, durationMs: 5000 });

	it('ברירת מחדל: position fixed, בלי aria-label', () => {
		const { body } = render(CooldownOverlay, { props: active() });
		expect(body).toContain('data-position="fixed"');
		expect(body).toMatch(/class="fixed inset-0/);
		expect(body).toContain('role="alertdialog"');
		expect(body).not.toContain('aria-label');
	});

	it('position=absolute מכסה רק את ההורה', () => {
		const { body } = render(CooldownOverlay, { props: { ...active(), position: 'absolute' } });
		expect(body).toContain('data-position="absolute"');
		expect(body).toMatch(/class="absolute inset-0/);
	});

	it('ariaLabel מוצמד ל-alertdialog', () => {
		const { body } = render(CooldownOverlay, { props: { ...active(), ariaLabel: 'טעות' } });
		expect(body).toMatch(/role="alertdialog"[^>]*aria-label="טעות"/);
	});

	it('לא מציג כלום כש-untilTs בעבר', () => {
		const { body } = render(CooldownOverlay, {
			props: { untilTs: Date.now() - 1000, durationMs: 5000 }
		});
		expect(body).not.toContain('alertdialog');
	});
});
