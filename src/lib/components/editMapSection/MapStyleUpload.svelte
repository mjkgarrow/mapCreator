<script lang="ts">
	import { getMapState } from '$lib/map.svelte';
	import AddFile from '../AddFile.svelte';

	const mapState = getMapState();

	function handleFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const jsonString = JSON.parse(e.target?.result as string);
				mapState.addStyle(jsonString);
			} catch (err) {
				alert('Invalid file format. Please upload a valid JSON file.');
			}
		};
		reader.readAsText(file);
	}

	function handlePasteText(text: string) {
		try {
			const jsonString = JSON.parse(text);
			mapState.addStyle(jsonString);
		} catch (err) {
			alert('Invalid JSON. Please check your pasted text and ensure it is valid JSON.');
		}
	}
</script>

<div>
	<p class="mb-2 font-medium text-neutral-700">
		Upload map style (use <a
			href="https://maplibre.org/maputnik/"
			target="_blank"
			class="cursor-pointer underline">Maputnik</a
		>)
	</p>
	<AddFile
		accept=".geojson,application/geo+json"
		onfile={handleFile}
		showPaste
		onpastetext={handlePasteText}
	/>
</div>
