<script lang="ts">
	/**
	 * AxisSelector — מסך בחירה גנרי למורה (platform-plan §5.6).
	 *
	 * fieldset לכל ציר, כפתורי "בחר הכל" / "נקה" לכל ציר, ו-checkbox לכל פריט.
	 * כל המחרוזות מגיעות מהצרכן (`labels`, `axis.displayName`) — אין עברית בקיט.
	 * הקומפוננטה controlled: מקבלת `selection` ומדווחת בחירה חדשה ב-`onchange`.
	 */
	import {
		clearAxis,
		getAxisSelection,
		isItemSelected,
		selectAllOnAxis,
		toggleAxisItem
	} from './selection';
	import type { AnySelectionAxis, AxisSelectorLabels, ProviderSelection } from './types';

	interface Props {
		axes: readonly AnySelectionAxis[];
		selection: ProviderSelection;
		onchange: (selection: ProviderSelection) => void;
		labels: AxisSelectorLabels;
		/** טקסט המונה ליד שם הציר. ברירת מחדל: `selected/total` */
		formatCount?: (selected: number, total: number) => string;
		/** רוחב מינימלי לפריט ב-grid (CSS value). ברירת מחדל: 3.5rem */
		itemMinWidth?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		axes,
		selection,
		onchange,
		labels,
		formatCount = (selected, total) => `${selected}/${total}`,
		itemMinWidth = '3.5rem',
		disabled = false,
		class: className = ''
	}: Props = $props();

	function countSelected(axis: AnySelectionAxis): number {
		const available = new Set(axis.getAvailableItems().map((item) => item.id));
		return getAxisSelection(selection, axis.id).filter((id) => available.has(id)).length;
	}
</script>

<div class="flex flex-col gap-4 {className}">
	{#each axes as axis (axis.id)}
		{@const items = axis.getAvailableItems()}
		{@const ItemComponent = axis.itemComponent}
		<fieldset class="m-0 min-w-0 border-0 p-0" {disabled} data-axis-id={axis.id}>
			<legend class="sr-only">{axis.displayName}</legend>
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<span class="font-bold text-text-primary" aria-hidden="true">
					{#if axis.icon}<span>{axis.icon}</span>{/if}
					{axis.displayName}
					<span class="text-sm font-medium text-text-secondary">
						({formatCount(countSelected(axis), items.length)})
					</span>
				</span>
				<div class="flex items-center gap-1 text-sm">
					<button
						type="button"
						class="cursor-pointer rounded-sm border-0 bg-transparent px-2 py-1 font-medium text-brand-primary transition-colors hover:bg-surface-sunken"
						onclick={() => onchange(selectAllOnAxis(selection, axis))}
					>
						{labels.selectAll}
					</button>
					<span class="text-border-strong" aria-hidden="true">|</span>
					<button
						type="button"
						class="cursor-pointer rounded-sm border-0 bg-transparent px-2 py-1 font-medium text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
						onclick={() => onchange(clearAxis(selection, axis.id))}
					>
						{labels.clearAll}
					</button>
				</div>
			</div>

			<div
				class="grid gap-2"
				style="grid-template-columns: repeat(auto-fill, minmax({itemMinWidth}, 1fr));"
			>
				{#each items as item (item.id)}
					{@const selected = isItemSelected(selection, axis.id, item.id)}
					<label
						class="flex min-h-12 cursor-pointer select-none items-center justify-center rounded-md p-2 text-center font-bold transition-all
							has-[:focus-visible]:shadow-focus
							{selected
							? 'scale-105 bg-brand-primary text-text-on-brand shadow-card'
							: 'bg-surface-sunken text-text-secondary hover:text-text-primary'}"
						data-item-id={item.id}
					>
						<input
							type="checkbox"
							class="sr-only"
							checked={selected}
							onchange={(e) =>
								onchange(toggleAxisItem(selection, axis.id, item.id, e.currentTarget.checked))}
						/>
						{#if ItemComponent}
							<ItemComponent {item} {selected} />
						{:else}
							<span class="text-lg">{item.label}</span>
						{/if}
					</label>
				{/each}
			</div>
		</fieldset>
	{/each}
</div>
