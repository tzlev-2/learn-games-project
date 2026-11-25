import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const themesDirectory = new URL('../../../src/ui/theme/themes/', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, themesDirectory), 'utf8');
const roles = ['card-bg', 'card-border', 'text', 'text-muted', 'field-bg', 'field-text'];
const value = (css: string, name: string) =>
	css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();

describe('settings panel themes (BRIEF.md S3.2)', () => {
	it('defines the approved dark and light palette constants', () => {
		const tokens = read('../tokens.css');
		const palettes = {
			dark: [
				'rgba(255, 255, 255, 0.10)',
				'rgba(255, 255, 255, 0.10)',
				'#ffffff',
				'#cbd5e1',
				'rgba(0, 0, 0, 0.20)',
				'#ffffff'
			],
			light: [
				'rgba(255, 255, 255, 0.70)',
				'rgba(15, 23, 42, 0.10)',
				'#0f172a',
				'#475569',
				'#ffffff',
				'#334155'
			]
		};
		for (const [tone, expected] of Object.entries(palettes)) {
			roles.forEach((role, index) => {
				expect(value(tokens, `--panel-${tone}-${role}`)).toBe(expected[index]);
			});
		}
	});

	// התיקייה עצמה היא מקור הרשימה, כך שגם ערכה חדשה חייבת להגדיר את כל ששת התפקידים.
	for (const file of readdirSync(themesDirectory).filter((file) => file.endsWith('.css'))) {
		it(`${file} defines all six roles with a single approved tone and is imported`, () => {
			const css = read(file);
			const tone = file === 'passcode.css' ? 'dark' : 'light';
			for (const role of roles) {
				expect(value(css, `--theme-panel-${role}`)).toBe(`var(--panel-${tone}-${role})`);
			}
			const styles = read('../../../styles.css');
			expect(styles).toContain(`@import './ui/theme/themes/${file}';`);
		});
	}

	it('preserves slate tokens and header overrides except the panel tone and accessible blue accent', () => {
		const withoutPanel = (css: string) =>
			css
				.replace(/\/\*[\s\S]*?\*\//g, '')
				.replace(/--theme-panel-[\w-]+\s*:[^;]+;/g, '')
				.replace(/--theme-brand-primary(?:-hover)?\s*:[^;]+;/g, '')
				.replace(/--theme-text-on-brand\s*:[^;]+;/g, '')
				.replaceAll("data-theme='passcode'", "data-theme='slate'")
				.replace(/\s+/g, ' ')
				.trim();
		expect(withoutPanel(read('passcode.css'))).toBe(withoutPanel(read('slate.css')));
	});

	it('keeps the passcode accent visible on dark cards and its button text readable (S3.3)', () => {
		const css = read('passcode.css');
		const rgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
		const luminance = (color: number[]) => color.reduce((sum, channel, index) => {
			const value = channel / 255;
			const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
			return sum + linear * [0.2126, 0.7152, 0.0722][index];
		}, 0);
		const contrast = (a: number[], b: number[]) => {
			const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
			return (light + 0.05) / (dark + 0.05);
		};
		const accent = rgb(value(css, '--theme-brand-primary')!);
		const text = rgb(value(css, '--theme-text-on-brand')!);
		// שלושת עוגני הגרדיאנט של passcode, תחת כרטיס לבן בשקיפות 10%.
		// זהו חוזה צבע מחושב; מדידת הפיקסלים בפועל נשארת באימות הדפדפן.
		for (const backdrop of ['#1e293b', '#334155', '#0f172a']) {
			const card = rgb(backdrop).map((channel) => 255 * 0.1 + channel * 0.9);
			expect(contrast(accent, card)).toBeGreaterThanOrEqual(3);
		}
		expect(contrast(text, accent)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(text, rgb(value(css, '--theme-brand-primary-hover')!))).toBeGreaterThanOrEqual(4.5);
	});
});
