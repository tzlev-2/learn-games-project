<script lang="ts">
	import { OverlayTimerPage } from 'learn-booster-kit';
	import { goto } from '$app/navigation';
</script>

<OverlayTimerPage onUnavailable={() => void goto('/', { replaceState: true })} />
