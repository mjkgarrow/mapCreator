<script lang="ts">
	import { getMapState } from '$lib/map.svelte';

	const mapState = getMapState();

	let showLabels = $state(false);
	let showDisputedBoundaries = $state(true);
	let showAdmin2 = $state(true);
	let showAdmin4 = $state(false);
	let showAdmin6 = $state(false);
	let showAdmin8 = $state(false);
	// let showAdmin10 = $state(false);
	let showRoads = $state(false);
	let showWater = $state(true);
	let showBuildings = $state(false);
	let showLandcover = $state(false);
	let showHillshade = $state(false);
	let hillshadeOpacity = $state(0.5);
	let hillshadeExaggeration = $state(0.5);
	let stadiaHillshade = $state(true);
	let globe = $state(true);

	let zoom = $state(2);
	let bearing = $state(0);
	let pitch = $state(0);

	const mapVariables = [
		{ label: 'Labels (Text & Icons)', bind: () => showLabels, update: (v) => (showLabels = v) },
		{
			label: 'National boundaries',
			bind: () => showAdmin2,
			update: (v) => (showAdmin2 = v)
		},
		{
			label: 'Sub-national boundaries',
			bind: () => showAdmin4,
			update: (v) => (showAdmin4 = v)
		},
		{
			label: 'Counties & districts',
			bind: () => showAdmin6,
			update: (v) => (showAdmin6 = v)
		},
		{
			label: 'Neighbourhoods & suburbs',
			bind: () => showAdmin8,
			update: (v) => (showAdmin8 = v)
		},
		// {
		// 	label: 'Neighbourhoods/suburbs',
		// 	bind: () => showAdmin10,
		// 	update: (v) => (showAdmin10 = v)
		// },

		{
			label: 'Disputed Boundaries',
			bind: () => showDisputedBoundaries,
			update: (v) => (showDisputedBoundaries = v)
		},
		{ label: 'Roads & Transportation', bind: () => showRoads, update: (v) => (showRoads = v) },
		{ label: 'Water Features', bind: () => showWater, update: (v) => (showWater = v) },
		{ label: 'Landcover & Parks', bind: () => showLandcover, update: (v) => (showLandcover = v) },
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
		const useStadia = stadiaHillshade;

		if (!map) return;

		const updateHillshade = () => {
			if (!map.isStyleLoaded()) return;

			if (active) {
				const existingSource = map.getSource('hillshade-source') as any;
				const targetUrl = useStadia
					? 'https://tiles.stadiamaps.com/data/terrarium/{z}/{x}/{y}.png'
					: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

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

		// Explicitly read state variables synchronously so Svelte tracks them as dependencies
		const labels = showLabels;
		// const boundaries = showBoundaries;
		// const internalBoundaries = showInternalBoundaries;
		const disputedBoundaries = showDisputedBoundaries;
		const roads = showRoads;
		const water = showWater;
		const buildings = showBuildings;
		const landcover = showLandcover;
		const admin2 = showAdmin2;
		const admin4 = showAdmin4;
		const admin6 = showAdmin6;
		const admin8 = showAdmin8;
		// const admin10 = showAdmin10;

		if (!map) return;

		const updateVisibility = () => {
			const style = map.getStyle();
			if (!style || !style.layers) return;

			style.layers.forEach((layer: any) => {
				// Skip custom GeoJSON layers added by the user
				if (layer.source && map.getSource(layer.source)?.type === 'geojson') return;

				let visibility: 'visible' | 'none' | undefined = undefined;

				if (layer.type === 'symbol') {
					visibility = labels ? 'visible' : 'none';
				} else if (layer['source-layer'] === 'boundary' || layer['source-layer'] === 'admin') {
					const id = layer.id.toLowerCase();

					if (id.includes('disputed')) {
						visibility = disputedBoundaries ? 'visible' : 'none';
					} else if (id === 'boundary_2') {
						visibility = admin2 ? 'visible' : 'none';
					} else if (id === 'boundary_4') {
						visibility = admin4 ? 'visible' : 'none';
					} else if (id === 'boundary_6') {
						visibility = admin6 ? 'visible' : 'none';
					} else if (id === 'boundary_8') {
						visibility = admin8 ? 'visible' : 'none';
					}
				} else if (
					layer['source-layer'] === 'transportation' ||
					layer['source-layer'] === 'transportation_name'
				) {
					visibility = roads ? 'visible' : 'none';
				} else if (
					layer['source-layer'] === 'water' ||
					layer['source-layer'] === 'water_name' ||
					layer['source-layer'] === 'waterway'
				) {
					visibility = water ? 'visible' : 'none';
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
						<label class="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
							<input
								type="radio"
								name="hillshade-provider"
								value={true}
								bind:group={stadiaHillshade}
								disabled={!showHillshade}
								class="h-3 w-3 cursor-pointer border-neutral-300"
							/>
							Stadia
						</label>
						<label class="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
							<input
								type="radio"
								name="hillshade-provider"
								value={false}
								bind:group={stadiaHillshade}
								disabled={!showHillshade}
								class="h-3 w-3 cursor-pointer border-neutral-300"
							/>
							Amazon
						</label>
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
