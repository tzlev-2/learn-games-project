<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SettingsDemo from './_components/SettingsDemo.svelte';
</script>

<div class="sort-cards-background" data-theme="slate">
	<SettingsDemo onBack={() => void goto(`${base}/showcase`)} />
</div>

<style>
	.sort-cards-background {
		height: calc(100dvh - 4rem);
		min-height: 0;
		background: linear-gradient(to bottom, #fef3c7, #fff7ed, #fef9c3);
	}
</style>
