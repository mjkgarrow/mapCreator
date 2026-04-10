<script lang="ts">
	import { getMapState } from '$lib/map.svelte';
	import AddFile from '../AddFile.svelte';
	import geoBoundsResponse from '../../assets/geoBoundsResponse.json';

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
	// New state for country selection
	let countries = $state<
		{ countryName: string; countryCode: string; topoUrl: string; geojsonUrl: string }[]
	>([]);

	let uniqueCountries = $state(
		new Map<
			string,
			{ countryName: string; countryCode: string; topoUrl: string; geojsonUrl: string }
		>()
	);

	let selectedCountryCode = $state('');
	let isLoadingCountries = $state(false);
	let isLoadingGeoJSON = $state(false);
	let countryError = $state<string | null>(null);

	// Fetch list of countries on component mount
	$effect(() => {
		geoBoundsResponse.forEach((country) => {
			if (!uniqueCountries.has(country.boundaryISO)) {
				uniqueCountries.set(country.boundaryISO, {
					countryName: country.boundaryName,
					countryCode: country.boundaryISO,
					topoUrl: country.tjDownloadURL,
					geojsonUrl: country.gjDownloadURL
				});
			}
		});
		countries = Array.from(uniqueCountries.values()).sort((a, b) =>
			a.countryName.localeCompare(b.countryName)
		);
	});

	// Fetch GeoJSON for selected country
	$effect(() => {
		async function fetchSelectedCountryGeoJSON() {
			if (!selectedCountryCode) return;

			isLoadingGeoJSON = true;
			countryError = null; // Clear previous country-specific errors
			try {
				// const topoJSONUrl = uniqueCountries.get(selectedCountryCode)?.topoUrl;

				// if (!topoJSONUrl) throw new Error('Invalid topoJSON URL');

				// const response = await fetch(topoJSONUrl);
				const topoJSONUrl = uniqueCountries.get(selectedCountryCode)?.topoUrl.split('gbOpen/')[1];

				if (!topoJSONUrl) throw new Error('Invalid topoJSON URL');

				const response = await fetch('/api/geo/' + topoJSONUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const geojson = await response.json();
				mapState.addGeoJSON(geojson);
			} catch (err: any) {
				console.error(`Failed to fetch GeoJSON for ${selectedCountryCode}:`, err);
				countryError = `Failed to load GeoJSON for ${selectedCountryCode}: ${err.message}`;
			} finally {
				isLoadingGeoJSON = false;
			}
		}
		fetchSelectedCountryGeoJSON();
	});
</script>

<div class="space-y-4">
	<p class="mb-2 font-medium text-neutral-700">Upload GeoJSON data</p>
	<AddFile
		accept=".geojson,application/geo+json,.json"
		onfile={handleFile}
		showPaste
		onpastetext={handlePasteText}
	/>

	<div class="mt-6 flex flex-col gap-1">
		<label for="country-select" class="text-sm font-bold text-neutral-700"
			>Add Country from GeoBoundaries</label
		>
		{#if isLoadingCountries}
			<p class="text-sm text-neutral-500">Loading countries...</p>
		{:else if countryError}
			<p class="text-sm text-red-500">{countryError}</p>
		{:else}
			<select
				id="country-select"
				bind:value={selectedCountryCode}
				class="w-full rounded border border-neutral-300 bg-white p-2 text-sm"
				disabled={isLoadingGeoJSON}
			>
				<option value="">-- Select a country --</option>
				{#each countries as country (country.countryCode)}
					<option value={country.countryCode}>{country.countryName}</option>
				{/each}
			</select>
			{#if isLoadingGeoJSON}
				<p class="mt-1 text-sm text-neutral-500">
					Loading GeoJSON for {countries.find((c) => c.countryCode === selectedCountryCode)
						?.countryName || selectedCountryCode}...
				</p>
			{/if}
		{/if}
	</div>
</div>
