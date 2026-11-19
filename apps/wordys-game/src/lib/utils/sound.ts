/**
 * סאונד והקראה — דרך כלי האודיו של הקיט.
 *
 * - צלילי המשוב נפתרים דרך ה-manifest (`getAssetUrl`) בזמן ההשמעה.
 * - ההקראה היא Web Speech בלבד (`useFully: false`), כמו שהיה במשחק.
 */
import { getAssetUrl } from '$lib/services/assets';
import { language } from '$lib/services/language';
import { createUiSounds, speakText } from 'learn-booster-kit';

export { playAudio } from 'learn-booster-kit';

export const { playSuccess, playError } = createUiSounds({
	success: { src: () => getAssetUrl('ui_sounds/success.mp3'), volume: 0.5 },
	error: { src: () => getAssetUrl('ui_sounds/error.wav'), volume: 0.3 }
});

/**
 * הקראת שם האות בעברית (אָלֶף, בֵּית...)
 */
export function speakLetter(char: string): void {
	const name = language.letterNames[char] ?? char;
	void speak(name, true);
}

export function speak(text: string, interrupt = true): Promise<void> {
	return speakText(text, { interrupt, useFully: false });
}
