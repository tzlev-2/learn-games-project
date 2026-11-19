/** בדיקת SSR (node) ל-PlayIcon. */
import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import PlayIcon from '../../../src/ui/primitives/icons/PlayIcon.svelte';
import * as kit from '../../../src/index';

describe('PlayIcon', () => {
	it('SVG מלא (fill=currentColor), מוסתר מקוראי מסך, בגודל ברירת מחדל 24', () => {
		const { body } = render(PlayIcon, { props: {} });
		expect(body).toContain('fill="currentColor"');
		expect(body).toContain('aria-hidden="true"');
		expect(body).toContain('width="24"');
		expect(body).toContain('<polygon');
	});

	it('size ו-class מועברים', () => {
		const { body } = render(PlayIcon, { props: { size: 28, class: 'x' } });
		expect(body).toContain('width="28"');
		expect(body).toContain('class="x"');
	});

	it('מיוצא מ-index', () => {
		expect(kit.PlayIcon).toBe(PlayIcon);
	});
});
