import {
  boosterService,
  type BoosterServiceInitialized,
} from "learn-booster-kit";

let initialization: Promise<BoosterServiceInitialized> | undefined;

/** כל המסכים ממתינים לאותה פעולת אתחול, גם כשהמחזק כבוי במשחק. */
export function initializeBooster(): Promise<BoosterServiceInitialized> {
  return (initialization ??= boosterService.init());
}
