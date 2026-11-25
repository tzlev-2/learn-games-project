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

	it('preserves every slate token and header override in passcode except the panel tone', () => {
		const withoutPanel = (css: string) =>
			css
				.replace(/\/\*[\s\S]*?\*\//g, '')
				.replace(/--theme-panel-[\w-]+\s*:[^;]+;/g, '')
				.replaceAll("data-theme='passcode'", "data-theme='slate'")
				.replace(/\s+/g, ' ')
				.trim();
		expect(withoutPanel(read('passcode.css'))).toBe(withoutPanel(read('slate.css')));
	});
});
