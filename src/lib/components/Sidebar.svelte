<script lang="ts">
	import GeoJSONUpload from './addDataSection/GeoJSONUpload.svelte';
	import MapStyleUpload from './editMapSection/MapStyleUpload.svelte';
	import Details from './Details.svelte';
	import DataStyling from './addDataSection/DataStyling.svelte';
	import MapStyling from './editMapSection/MapStyling.svelte';
	import SaveImage from './saveImageSection/SaveImage.svelte';
</script>

<aside class="max-h-screen min-w-[450px] overflow-auto py-4">
	<h2 class="mb-4 text-center">Map Creator</h2>
	<div class="space-y-0">
		<Details open elementNum="1" title="Add your data">
			<div class="grid gap-4 px-3 py-4">
				<GeoJSONUpload />
				<DataStyling />
			</div>
		</Details>
		<Details open elementNum="2" title="Edit the map">
			<div class="grid gap-4 px-3 py-4">
				<MapStyleUpload />
				<MapStyling />
			</div>
		</Details>
		<Details open elementNum="3" title="Save image">
			<div class="grid gap-4 px-3 py-4">
				<SaveImage />
			</div>
		</Details>
	</div>

	<!-- <ExportControl /> -->
</aside>

<style>
	aside {
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
	}
</style>
