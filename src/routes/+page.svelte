<script lang="ts">
	import { setMapState } from '$lib/map.svelte';
	import Map from '$lib/components/Map.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	// Initialize the central state for descendants to use
	setMapState();
</script>

<div class="layout">
	<Sidebar />
	<main class="main-content">
		<Map />
	</main>
</div>

<style>
	.layout {
		display: flex;
		height: 100vh;
		min-width: 100%;
	}
	.main-content {
		flex: 1;
		display: flex;
	}
</style>
