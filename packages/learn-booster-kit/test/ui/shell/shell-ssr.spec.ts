/**
 * בדיקות SSR (node) ל-props התוספתיים של קומפוננטות ה-shell.
 * render מ-svelte/server — בלי דפדפן; בודקים את ה-HTML שנוצר.
 * בדיקות האינטראקציה (browser) נמצאות ב-apps/kit-test-screen.
 */
import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import GameShell from '../../../src/ui/shell/GameShell.svelte';
import HeaderBar from '../../../src/ui/shell/HeaderBar.svelte';
import StartScreen from '../../../src/ui/shell/StartScreen.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

/** מחזיר את ה-attribute class של התגית הראשונה שתואמת ל-selector פשוט (tag + attr). */
function classOf(html: string, re: RegExp): string {
	const m = html.match(re);
	if (!m) throw new Error(`no match for ${re}`);
	const cls = m[0].match(/class="([^"]*)"/);
	return cls ? cls[1] : '';
}

describe('GameShell', () => {
	it('ברירת מחדל: layout=page עם min-height 100dvh ורקע surface-base', () => {
		const { body } = render(GameShell, { props: { children: text('X') } });
		expect(body).toContain('data-layout="page"');
		expect(body).toContain('min-height: 100dvh');
		expect(body).toContain('bg-surface-base');
	});

	it('layout=fill: ממלא את ההורה בלי min-height של viewport', () => {
		const { body } = render(GameShell, { props: { children: text('X'), layout: 'fill' } });
		expect(body).toContain('data-layout="fill"');
		expect(body).not.toContain('100dvh');
		const root = classOf(body, /<div data-layout="fill"[^>]*>/);
		expect(root).toContain('h-full');
		expect(root).toContain('min-h-0');
		expect(classOf(body, /<main[^>]*>/)).toContain('min-h-0');
	});

	it('background=none: בלי class של רקע', () => {
		const { body } = render(GameShell, { props: { children: text('X'), background: 'none' } });
		expect(body).not.toContain('bg-surface-base');
		expect(body).not.toContain('bg-surface-sunken');
	});

	it('background=sunken נשמר', () => {
		const { body } = render(GameShell, { props: { children: text('X'), background: 'sunken' } });
		expect(body).toContain('bg-surface-sunken');
	});
});

describe('HeaderBar', () => {
	it('ברירת מחדל: המרכז flex-1, הצדדים בלי flex-1', () => {
		const { body } = render(HeaderBar, {
			props: { leftActions: text('L'), centerInfo: text('C'), rightActions: text('R') }
		});
		expect(body).toContain('data-balanced="false"');
		const divs = [...body.matchAll(/<div class="([^"]*)"/g)].map((m) => m[1]);
		expect(divs).toHaveLength(3);
		expect(divs[0]).not.toContain('flex-1');
		expect(divs[1]).toContain('flex-1');
		expect(divs[2]).not.toContain('flex-1');
	});

	it('balanced: הצדדים flex-1 basis-0, המרכז shrink-0', () => {
		const { body } = render(HeaderBar, {
			props: { balanced: true, leftActions: text('L'), centerInfo: text('C'), rightActions: text('R') }
		});
		expect(body).toContain('data-balanced="true"');
		const divs = [...body.matchAll(/<div class="([^"]*)"/g)].map((m) => m[1]);
		expect(divs[0]).toContain('flex-1 basis-0');
		expect(divs[1]).toContain('shrink-0');
		expect(divs[1]).not.toContain('flex-1');
		expect(divs[2]).toContain('flex-1 basis-0');
		expect(body).toContain('<span>L</span>');
		expect(body).toContain('<span>C</span>');
		expect(body).toContain('<span>R</span>');
	});
});

describe('StartScreen', () => {
	const base = { title: 'T', primaryAction: { label: 'GO', onclick: () => {} } };

	it('ברירת מחדל: רקע surface-base וכפתור בצבע primary', () => {
		const { body } = render(StartScreen, { props: base });
		expect(body).toContain('data-background="base"');
		expect(body).toContain('bg-surface-base');
		expect(body).toContain('data-color="primary"');
		expect(body).toContain('GO');
	});

	it('כותרת: tokens אופציונליים עם fallback לברירות המחדל', () => {
		const { body } = render(StartScreen, { props: base });
		expect(body).toContain('var(--theme-font-size-display, var(--theme-font-size-xl))');
		expect(body).toContain('var(--theme-text-heading, var(--theme-text-primary))');
		expect(body).toContain('var(--theme-font-weight-display, 700)');
	});

	it('background=none: בלי רקע', () => {
		const { body } = render(StartScreen, { props: { ...base, background: 'none' } });
		expect(body).toContain('data-background="none"');
		expect(body).not.toContain('bg-surface-base');
	});

	it('primaryAction: color, icon ו-class מועברים לכפתור', () => {
		const { body } = render(StartScreen, {
			props: {
				...base,
				primaryAction: {
					label: 'GO',
					onclick: () => {},
					color: 'secondary',
					icon: text('ICON'),
					class: 'my-cta'
				}
			}
		});
		expect(body).toContain('data-color="secondary"');
		expect(body).toContain('bg-brand-secondary');
		expect(body).toContain('<span>ICON</span>');
		expect(classOf(body, /<button[^>]*>/)).toContain('my-cta');
		// אייקון מוביל — לפני ה-label בסדר ה-DOM
		expect(body.indexOf('ICON')).toBeLessThan(body.indexOf('GO'));
	});

	it('ברירת מחדל: layout=screen עם min-h-screen ו-justify-center', () => {
		const { body } = render(StartScreen, { props: base });
		expect(body).toContain('data-layout="screen"');
		const root = classOf(body, /<div data-background[^>]*>/);
		expect(root).toContain('min-h-screen');
		expect(root).toContain('justify-center');
		expect(root).not.toContain('h-full');
	});

	it('layout=fill: ממלא את ההורה, גולל, מרכוז safe', () => {
		const { body } = render(StartScreen, { props: { ...base, layout: 'fill', class: 'py-4' } });
		expect(body).toContain('data-layout="fill"');
		const root = classOf(body, /<div data-background[^>]*>/);
		expect(root).toContain('h-full');
		expect(root).toContain('overflow-y-auto');
		expect(root).toContain('justify-center-safe');
		expect(root).not.toContain('min-h-screen');
		expect(root).toContain('py-4');
	});

	it('children: מרונדר בין הכותרת לכפתור, מחוץ לעמודת הכפתור', () => {
		const { body } = render(StartScreen, { props: { ...base, children: text('PICKER') } });
		const iTitle = body.indexOf('>T<');
		const iPicker = body.indexOf('PICKER');
		const iCol = body.indexOf('max-w-xs');
		expect(iTitle).toBeGreaterThan(-1);
		expect(iPicker).toBeGreaterThan(iTitle);
		expect(iPicker).toBeLessThan(iCol);
		expect(iCol).toBeLessThan(body.indexOf('GO'));
	});
});
