import { boosterService, type BoosterServiceInitialized } from 'learn-booster-kit';

let initialization: Promise<BoosterServiceInitialized> | undefined;

/** ה-layout והדוגמה ממתינים לאותה פעולת אתחול, גם כשהיא עדיין רצה. */
export function initializeBooster(): Promise<BoosterServiceInitialized> {
	return (initialization ??= boosterService.init());
}
