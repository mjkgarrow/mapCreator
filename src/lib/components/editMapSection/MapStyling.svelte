<script lang="ts">
	import { getMapState } from '$lib/map.svelte';

	const mapState = getMapState();
	const hillshadeProviders = {
		Stadia: 'https://tiles.stadiamaps.com/data/terrarium/{z}/{x}/{y}.png',
		Amazon: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
		OSM: 'https://klokantech.github.io/naturalearthtiles/tiles/natural_earth_2_shaded_relief.raster/{z}/{x}/{y}.png'
	};

	let showAllCountryBoundary = $state(true);
	let showStateBoundary = $state(false);
	let showDistrictBoundaries = $state(false);
	let showSuburbBoundaries = $state(false);
	let showAllBoundaries = $state(false);
	let showCountryBoundary = $state(false);
	let showDisputedBoundaries = $state(false);

	let showCapitalCountryRank1 = $state(false);
	let showCapitalCountryRank2 = $state(false);
	let showCapitalCountryRank3 = $state(false);
	let showCapitalCities = $state(false);
	let showRoads = $state(false);
	let showRivers = $state(false);
	let showLakes = $state(false);
	let showBuildings = $state(false);
	let showLandcover = $state(false);
	let showHillshade = $state(false);
	let hillshadeOpacity = $state(0.5);
	let hillshadeExaggeration = $state(0.5);
	let hillshadeProvider = $state('amazon');
	let globe = $state(true);

	let zoom = $state(2);
	let bearing = $state(0);
	let pitch = $state(0);

	const mapVariables = [
		{
			label: 'Country boundaries (all)',
			bind: () => showAllCountryBoundary,
			update: (v) => (showAllCountryBoundary = v)
		},
		{
			label: 'State boundaries',
			bind: () => showStateBoundary,
			update: (v) => (showStateBoundary = v)
		},
		{
			label: 'District boundaries',
			bind: () => showDistrictBoundaries,
			update: (v) => (showDistrictBoundaries = v)
		},
		{
			label: 'Neighbourhoods & suburbs',
			bind: () => showSuburbBoundaries,
			update: (v) => (showSuburbBoundaries = v)
		},
		{
			label: 'All boundaries',
			bind: () => showAllBoundaries,
			update: (v) => (showAllBoundaries = v)
		},
		{
			label: 'Country boundaries (excl disputed)',
			bind: () => showCountryBoundary,
			update: (v) => (showCountryBoundary = v)
		},
		{
			label: 'Disputed Boundaries',
			bind: () => showDisputedBoundaries,
			update: (v) => (showDisputedBoundaries = v)
		},
		{
			label: 'Country label rank 1',
			bind: () => showCapitalCountryRank1,
			update: (v) => (showCapitalCountryRank1 = v)
		},
		{
			label: 'Country label rank 2',
			bind: () => showCapitalCountryRank2,
			update: (v) => (showCapitalCountryRank2 = v)
		},
		{
			label: 'Country label rank 3',
			bind: () => showCapitalCountryRank3,
			update: (v) => (showCapitalCountryRank3 = v)
		},
		{
			label: 'Capital cities',
			bind: () => showCapitalCities,
			update: (v) => (showCapitalCities = v)
		},
		// The new specific label toggles will be rendered as sub-options under 'Labels (Text & Icons)'
		{ label: 'Rivers', bind: () => showRivers, update: (v) => (showRivers = v) },
		{ label: 'Lakes', bind: () => showLakes, update: (v) => (showLakes = v) },
		{ label: 'Landcover & Parks', bind: () => showLandcover, update: (v) => (showLandcover = v) },
		{ label: 'Roads & Transportation', bind: () => showRoads, update: (v) => (showRoads = v) },
		{ label: 'Buildings', bind: () => showBuildings, update: (v) => (showBuildings = v) },
		{ label: '3D Hillshade', bind: () => showHillshade, update: (v) => (showHillshade = v) }
	];

	// Watch for camera changes to update inputs
	$effect(() => {
		const map = mapState.map;
		if (!map) return;

		const updateCameraState = () => {
			zoom = Number(map.getZoom().toFixed(2));
			bearing = Number(map.getBearing().toFixed(1));
			pitch = Number(map.getPitch().toFixed(1));
		};

		map.on('move', updateCameraState);
		updateCameraState();

		return () => {
			map.off('move', updateCameraState);
		};
	});

	// Watch for globe toggle to update the map projection
	$effect(() => {
		const map = mapState.map;
		const useGlobe = globe;

		if (!map) return;

		const updateProjection = () => {
			try {
				map.setProjection({ type: useGlobe ? 'globe' : 'mercator' });
			} catch (err) {
				console.warn('Error setting projection:', err);
			}
		};

		if (map.isStyleLoaded()) {
			updateProjection();
		} else {
			map.once('styledata', updateProjection);
		}
	});

	// Watch for hillshade toggle
	$effect(() => {
		const map = mapState.map;
		const active = showHillshade;
		const hillshadeProviderType = hillshadeProvider;

		if (!map) return;

		const updateHillshade = () => {
			if (!map.isStyleLoaded()) return;

			if (active) {
				const existingSource = map.getSource('hillshade-source') as any;
				const targetUrl = hillshadeProviders[hillshadeProviderType];

				if (existingSource && existingSource.tiles[0] !== targetUrl) {
					if (map.getLayer('hillshade-layer')) map.removeLayer('hillshade-layer');
					map.setTerrain(null);
					map.removeSource('hillshade-source');
				}

				if (!map.getSource('hillshade-source')) {
					map.addSource('hillshade-source', {
						type: 'raster-dem',
						tiles: [targetUrl],
						encoding: 'terrarium',
						tileSize: 512,
						maxzoom: 15
					});
				}

				if (!map.getLayer('hillshade-layer')) {
					const layers = map.getStyle().layers;
					const firstSymbolId = layers.find((l: any) => l.type === 'symbol')?.id;

					map.addLayer(
						{
							id: 'hillshade-layer',
							type: 'hillshade',
							source: 'hillshade-source',
							paint: { 'hillshade-exaggeration': 0.5, 'hillshade-method': 'combined' }
						},
						firstSymbolId
					);
				}

				const rgba = `rgba(0, 0, 0, ${hillshadeOpacity})`;
				map.setPaintProperty('hillshade-layer', 'hillshade-shadow-color', rgba);
				map.setPaintProperty('hillshade-layer', 'hillshade-accent-color', rgba);
				map.setLayoutProperty('hillshade-layer', 'visibility', 'visible');
				map.setTerrain({ source: 'hillshade-source', exaggeration: hillshadeExaggeration });
			} else {
				if (map.getLayer('hillshade-layer')) {
					map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
				}
				map.setTerrain(null);
			}
		};

		if (map.isStyleLoaded()) {
			updateHillshade();
		} else {
			map.once('styledata', updateHillshade);
		}
	});

	// Watch for map changes to dynamically update the visibility of base map layers
	$effect(() => {
		const map = mapState.map;

		const capitalCountryRank1 = showCapitalCountryRank1;
		const capitalCountryRank2 = showCapitalCountryRank2;
		const capitalCountryRank3 = showCapitalCountryRank3;
		const capitalCities = showCapitalCities;

		const disputedBoundaries = showDisputedBoundaries;
		const roads = showRoads;
		const rivers = showRivers;
		const lakes = showLakes;
		const buildings = showBuildings;
		const landcover = showLandcover;
		const countryBoundary = showCountryBoundary;
		const allCountryBoundary = showAllCountryBoundary;
		const stateBoundary = showStateBoundary;
		const districtBoundaries = showDistrictBoundaries;
		const suburbBoundaries = showSuburbBoundaries;
		const allBoundaries = showAllBoundaries;

		if (!map) return;

		const labelLayersControlledByShowLabels = [
			'water_name_point_label',
			'water_name_line_label',
			'highway-name-path',
			'highway-name-minor',
			'highway-name-major',
			'label_other',
			'label_village',
			'label_town',
			'highway-name-path',
			'highway-name-minor',
			'highway-name-major',
			'label_state',
			'label_city'
		];

		const updateVisibility = () => {
			const style = map.getStyle();
			if (!style || !style.layers) return;

			style.layers.forEach((layer: any) => {
				// Skip custom GeoJSON layers added by the user
				if (layer.source && map.getSource(layer.source)?.type === 'geojson') {
					return;
				}

				let visibility: 'visible' | 'none' | undefined = undefined; // Default to undefined, meaning no change to visibility
				const id = layer.id.toLowerCase();

				if (labelLayersControlledByShowLabels.includes(id)) {
					visibility = 'none';
				}

				// Handle specific label layers first, nested under the main 'showLabels' toggle
				if (id === 'label_country_1') {
					visibility = capitalCountryRank1 ? 'visible' : 'none';
				} else if (id === 'label_country_2') {
					visibility = capitalCountryRank2 ? 'visible' : 'none';
				} else if (id === 'label_country_3') {
					visibility = capitalCountryRank3 ? 'visible' : 'none';
				} else if (id === 'label_city_capital' || id === 'label_city_capital_point') {
					visibility = capitalCities ? 'visible' : 'none';
				} else if (layer['source-layer'] === 'boundary' || layer['source-layer'] === 'admin') {
					if (id.includes('disputed')) {
						visibility = disputedBoundaries ? 'visible' : 'none';
					} else if (id === 'country_boundary') {
						visibility = countryBoundary ? 'visible' : 'none';
					} else if (id === 'all_country_boundary') {
						visibility = allCountryBoundary ? 'visible' : 'none';
					} else if (id === 'state_boundary') {
						visibility = stateBoundary ? 'visible' : 'none';
					} else if (id === 'district_boundaries') {
						visibility = districtBoundaries ? 'visible' : 'none';
					} else if (id === 'suburb_boundaries') {
						visibility = suburbBoundaries ? 'visible' : 'none';
					} else if (id === 'all_boundaries') {
						visibility = allBoundaries ? 'visible' : 'none';
					}
				} else if (layer['source-layer'] === 'transportation') {
					visibility = roads ? 'visible' : 'none';
				} else if (layer['id'] === 'waterway') {
					visibility = rivers ? 'visible' : 'none';
				} else if (layer['id'] === 'lakes') {
					visibility = lakes ? 'visible' : 'none';
				} else if (layer['source-layer'] === 'building') {
					visibility = buildings ? 'visible' : 'none';
				} else if (
					layer['source-layer'] === 'landcover' ||
					layer['source-layer'] === 'landuse' ||
					layer['source-layer'] === 'park'
				) {
					visibility = landcover ? 'visible' : 'none';
				}

				if (visibility !== undefined) {
					try {
						const currentVisibility = map.getLayoutProperty(layer.id, 'visibility') || 'visible';
						if (currentVisibility !== visibility) {
							map.setLayoutProperty(layer.id, 'visibility', visibility);
						}
					} catch (err) {
						console.warn('Error setting visibility:', err);
					}
				}
			});
		};

		if (map.isStyleLoaded()) {
			updateVisibility();
		}

		map.on('styledata', updateVisibility);

		return () => {
			map.off('styledata', updateVisibility);
		};
	});
</script>

<div class="space-y-4 px-2 py-4">
	<div class="flex flex-col gap-1">
		<h2 class="text-sm font-bold text-neutral-700">Map Projection</h2>
		<p class="text-xs text-neutral-500">Toggle 3D globe view.</p>
	</div>

	<div class="rounded bg-neutral-100 p-3 text-sm">
		<label class="mb-2 flex cursor-pointer items-center gap-2">
			<input
				type="checkbox"
				bind:checked={globe}
				class="h-4 w-4 cursor-pointer rounded border-neutral-300"
			/>
			<span class="font-medium text-neutral-700">Globe Projection</span>
		</label>

		<div class="grid grid-cols-[repeat(3,120px)] gap-2 border-t border-neutral-200 pt-3">
			<div class="flex flex-col gap-1">
				<label for="map-zoom" class="text-xs font-medium text-neutral-500">Zoom</label>
				<input
					id="map-zoom"
					type="number"
					step="0.1"
					min="0"
					max="24"
					value={zoom}
					oninput={(e: any) => mapState.map?.setZoom(Number(e.target.value))}
					class="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label for="map-bearing" class="text-xs font-medium text-neutral-500">Bearing</label>
				<input
					id="map-bearing"
					type="number"
					step="1"
					value={bearing}
					oninput={(e: any) => mapState.map?.setBearing(Number(e.target.value))}
					class="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label for="map-pitch" class="text-xs font-medium text-neutral-500">Pitch</label>
				<input
					id="map-pitch"
					type="number"
					step="1"
					min="0"
					max="85"
					value={pitch}
					oninput={(e: any) => mapState.map?.setPitch(Number(e.target.value))}
					class="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs"
				/>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-1 pt-2">
		<h2 class="text-sm font-bold text-neutral-700">Base Map Layers</h2>
		<p class="text-xs text-neutral-500">Toggle visibility of default map features.</p>
	</div>

	<div class="flex flex-col gap-3 rounded bg-neutral-100 p-3 text-sm">
		{#each mapVariables as toggle, i}
			<label
				class="flex cursor-pointer items-center gap-2 {i > 0
					? 'border-t border-neutral-200 pt-2'
					: ''}"
			>
				<input
					type="checkbox"
					checked={toggle.bind()}
					onchange={(e: any) => toggle.update(e.target.checked)}
					class="h-4 w-4 cursor-pointer rounded border-neutral-300"
				/>
				<span class="font-medium text-neutral-700">{toggle.label}</span>
			</label>

			{#if toggle.label === '3D Hillshade'}
				<div class="grid grid-cols-[11ch_1fr] items-center gap-3">
					<span class="text-right font-mono text-xs text-neutral-500">Provider</span>
					<div class="flex gap-4">
						{#each Object.keys(hillshadeProviders) as provider}
							<label class="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
								<input
									type="radio"
									name="hillshade-provider"
									value={provider}
									bind:group={hillshadeProvider}
									disabled={!showHillshade}
									class="h-3 w-3 cursor-pointer border-neutral-300"
								/>
								{provider}
							</label>
						{/each}
					</div>
				</div>
				<div class="grid grid-cols-[11ch_1fr_5ch] items-center gap-3">
					<span class="text-right font-mono text-xs text-neutral-500">Hillshade opacity</span>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={hillshadeOpacity}
						disabled={!showHillshade}
						class="h-1.5 w-full cursor-pointer rounded-lg bg-neutral-300 disabled:appearance-none disabled:opacity-50"
					/>
					<span class="min-w-[3ch] text-right font-mono text-xs text-neutral-500">
						{Math.round(hillshadeOpacity * 100)}%
					</span>
				</div>
				<div class="grid grid-cols-[11ch_1fr_5ch] items-center gap-3">
					<span class="text-right font-mono text-xs text-neutral-500">Hillshade exaggeration</span>
					<input
						type="range"
						min="0"
						max="5"
						step="0.01"
						bind:value={hillshadeExaggeration}
						disabled={!showHillshade}
						class="h-1.5 w-full cursor-pointer rounded-lg bg-neutral-300 disabled:appearance-none disabled:opacity-50"
					/>
					<span class="min-w-[3ch] text-right font-mono text-xs text-neutral-500">
						{hillshadeExaggeration}
					</span>
				</div>
			{/if}
		{/each}
	</div>
</div>
