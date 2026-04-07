<script lang="ts">
	import { getMapState } from '$lib/map.svelte';
	const mapState = getMapState();
</script>

<div class="control-group">
	<h3>Export Map</h3>
	<!-- <button onclick={() => mapState.exportImage()}>Download Image</button> -->

	<button onclick={() => mapState.exportImage()}> Download Current View </button>

	<button class="high-res" onclick={() => mapState.exportHighRes(4000, 4000)}>
		Download Hi-Res Square (4000x4000)
	</button>

	<button class="high-res" onclick={() => mapState.exportHighRes(2000, 4000)}>
		Download Vertical Poster (2000x4000)
	</button>
</div>

<style>
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 1.1rem;
	}
	button {
		padding: 0.5rem;
		cursor: pointer;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: bold;
	}
	button:hover {
		background: #0056b3;
	}
</style>
