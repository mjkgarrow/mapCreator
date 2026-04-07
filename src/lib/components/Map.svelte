<script lang="ts">
	import { onMount } from 'svelte';
	import { getMapState } from '$lib/map.svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';

	const mapState = getMapState();
	let mapContainer: HTMLDivElement;

	onMount(() => {
		mapState.initMap(mapContainer);
		return () => mapState.destroy();
	});
</script>

<div class="map-wrapper">
	<div bind:this={mapContainer} class="map"></div>
</div>

<style>
	.map-wrapper {
		flex: 1;
		position: relative;
		width: 100%;
		height: 100%;
	}
	.map {
		position: absolute;
		inset: 0;
	}
</style>
