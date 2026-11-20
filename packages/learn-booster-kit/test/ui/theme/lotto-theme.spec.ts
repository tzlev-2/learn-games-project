/**
 * Theme "lotto" — מגדיר את כל ה-tokens של theme ברירת המחדל, נטען ב-styles.css,
 * ו-radius נשאר בערכים שהמשחק קיבל לפניו (אחרת כל `rounded-*` במשחק משתנה).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const tokenNames = (css: string) =>
	new Set([...css.matchAll(/(--theme-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const tokenValue = (css: string, name: string) =>
	css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();

describe('lotto theme', () => {
	const lotto = read('../../../src/ui/theme/themes/lotto.css');
	const def = read('../../../src/ui/theme/themes/default.css');

	it('is scoped to [data-theme=lotto]', () => {
		expect(lotto).toContain("[data-theme='lotto']");
	});

	it('defines every token the default theme defines', () => {
		const missing = [...tokenNames(def)].filter((name) => !tokenNames(lotto).has(name));
		expect(missing).toEqual([]);
	});

	it('keeps the radii lotto rendered with before the theme (default theme: 4/8/16px)', () => {
		for (const size of ['sm', 'md', 'lg']) {
			expect(tokenValue(lotto, `--theme-radius-${size}`)).toBe(tokenValue(def, `--theme-radius-${size}`));
		}
	});

	it('is imported by styles.css before tokens.css', () => {
		const styles = read('../../../src/styles.css');
		const themeIdx = styles.indexOf("themes/lotto.css'");
		expect(themeIdx).toBeGreaterThan(-1);
		expect(themeIdx).toBeLessThan(styles.indexOf("theme/tokens.css'"));
	});
});
