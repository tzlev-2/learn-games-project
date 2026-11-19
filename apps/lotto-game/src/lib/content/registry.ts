/**
 * ה-registry של הלוטו — instance של registry הקיט.
 * הרישום עצמו מתבצע ב-`providers/index.ts`; ההצהרה אילו Providers הלוטו
 * צורך נמצאת ב-`game-content.ts`.
 */
import { createContentRegistry } from 'learn-booster-kit';

/** instance יחיד של ה-registry במשחק */
export const contentRegistry = createContentRegistry();
