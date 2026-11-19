/** בדיקות SSR (node) ל-CooldownRing ול-HomeIcon. */
import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import CooldownRing from '../../../src/ui/primitives/CooldownRing.svelte';
import HomeIcon from '../../../src/ui/primitives/icons/HomeIcon.svelte';
import * as kit from '../../../src/index';

describe('CooldownRing (SSR)', () => {
	it('פעיל: מספר השניות שנותרו, הודעה, צבעי theme', () => {
		const { body } = render(CooldownRing, {
			props: { untilTs: Date.now() + 2500, durationMs: 5000, message: 'המתן...' }
		});
		expect(body).toContain('data-active="true"');
		expect(body).toMatch(/>\s*3\s*</);
		expect(body).toContain('המתן...');
		expect(body).toContain('var(--theme-feedback-error)');
		expect(body).toContain('var(--theme-border-subtle)');
		expect(body).toContain('opacity-100');
		expect(body).toContain('h-14 w-14 sm:h-20 sm:w-20');
	});

	it('הקשת משקפת את החלק שנותר', () => {
		const circ = 2 * Math.PI * 35;
		const { body } = render(CooldownRing, {
			props: { untilTs: Date.now() + 5000, durationMs: 10000 }
		});
		const m = body.match(/stroke-dasharray="([\d.]+) ([\d.]+)"/);
		expect(m).not.toBeNull();
		expect(Number(m![2])).toBeCloseTo(circ, 3);
		expect(Number(m![1]) / circ).toBeCloseTo(0.5, 1);
	});

	it('לא פעיל + reserveSpace (ברירת מחדל): תופס מקום אבל שקוף', () => {
		const { body } = render(CooldownRing, { props: { untilTs: 0, durationMs: 3000 } });
		expect(body).toContain('data-active="false"');
		expect(body).toContain('invisible opacity-0');
		expect(body).toContain('aria-hidden="true"');
	});

	it('לא פעיל + reserveSpace=false: לא מרונדר', () => {
		const { body } = render(CooldownRing, {
			props: { untilTs: 0, durationMs: 3000, reserveSpace: false }
		});
		expect(body).not.toContain('data-active');
	});

	it('classes מותאמים', () => {
		const { body } = render(CooldownRing, {
			props: {
				untilTs: Date.now() + 1000,
				durationMs: 1000,
				class: 'my-ring',
				ringClass: 'h-10 w-10',
				numberClass: 'text-lg',
				message: 'x',
				messageClass: 'text-sm'
			}
		});
		expect(body).toContain('my-ring');
		expect(body).toContain('h-10 w-10');
		expect(body).toContain('text-lg');
		expect(body).toContain('text-sm');
	});
});

describe('HomeIcon', () => {
	it('SVG stroke, aria-hidden, גודל ו-class', () => {
		const { body } = render(HomeIcon, { props: { size: 20, class: 'y' } });
		expect(body).toContain('stroke="currentColor"');
		expect(body).toContain('aria-hidden="true"');
		expect(body).toContain('width="20"');
		expect(body).toContain('class="y"');
	});
});

describe('exports', () => {
	it('מיוצא מ-index', () => {
		expect(kit.CooldownRing).toBe(CooldownRing);
		expect(kit.HomeIcon).toBe(HomeIcon);
	});
});
