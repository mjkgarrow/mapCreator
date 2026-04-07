<script lang="ts">
	import { getMapState } from '$lib/map.svelte';
	import AddFile from '../AddFile.svelte';

	const mapState = getMapState();

	function handleFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const geojson = JSON.parse(e.target?.result as string);
				mapState.addGeoJSON(geojson);
			} catch (err) {
				alert('Invalid file format. Please upload a valid GeoJSON file.');
			}
		};
		reader.readAsText(file);
	}

	function handlePasteText(text: string) {
		try {
			const geojson = JSON.parse(text);
			mapState.addGeoJSON(geojson);
		} catch (err) {
			alert('Invalid JSON. Please check your pasted text and ensure it is valid GeoJSON.');
		}
	}
</script>

<div>
	<p class="mb-2 font-medium text-neutral-700">Upload geojson data</p>
	<AddFile
		accept=".geojson,application/geo+json"
		onfile={handleFile}
		showPaste
		onpastetext={handlePasteText}
	/>
</div>
