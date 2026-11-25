<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SettingsDemo from './_components/SettingsDemo.svelte';
</script>

<SettingsDemo onBack={() => void goto(`${base}/showcase`)} />
