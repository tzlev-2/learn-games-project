You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

# find-letter-game

**מה זה:** משחק "איפה האות?" — תלמיד שומע אות ומוצא אותה על הלוח.

**סטטוס:**
- ✅ הכי מתקדם בפלטפורמיזציה — SettingsStore מחובר ל-`configManager` של הקיט
- ✅ migration system עבד (schemaVersion 1)
- ✅ UI מהקיט: `StartScreen`, `GameShell`, `HeaderBar`, `CooldownOverlay`, primitives ו-icons; theme `find-letter` (`<html data-theme>` ב-`app.html`). ‏`Board`/`LetterCard` מקומיים עם tokens של ה-theme
- ✅ רשום ב-`registerGameSchema` (גרסה 6) — מיגרציה אידמפוטנטית ב-`stores/settings-migration.ts`
- ✅ תוכן מ-ContentProvider: ה-Provider המשותף "אותיות וניקוד" מהקיט (`learn-booster-kit/content/hebrew-letters`), דרך `resolveGameContent` (`src/lib/content/game-content.ts`). המאגר (אותיות, ניקוד, TTS) לא נמצא במשחק — הוא בקיט, משותף עם הלוטו

**הפניות:**
- כל כללי הקוד: `../../docs/coding-conventions.md`
- design spec מכשירים: `../../docs/design-specs.md`
- תיעוד: `docs/walkthrough.md`
