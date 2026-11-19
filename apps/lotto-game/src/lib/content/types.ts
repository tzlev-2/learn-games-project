/**
 * טיפוסי מערכת התוכן — מגיעים מה-ContentProvider הרב-צירי של הקיט.
 * הקובץ נשאר כ-re-export כדי שייבואים קיימים (`$lib/content/types`) ימשיכו לעבוד.
 * תיעוד: `packages/learn-booster-kit/docs/content-provider.md`.
 */
export type {
	ContentProvider,
	AnyContentProvider,
	ContentItem,
	CardContent,
	CardStyleOptions,
	CardContentProps,
	AxisItemProps,
	ProviderSettingsProps,
	SelectionAxis,
	ProviderSelection
} from 'learn-booster-kit';
export { isContentProvider } from 'learn-booster-kit';
