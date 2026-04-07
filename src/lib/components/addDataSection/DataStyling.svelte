<script lang="ts">
	import { getMapState } from '$lib/map.svelte';
	import { v8 } from '@maplibre/maplibre-gl-style-spec';

	const mapState = getMapState();
	const hiddenProps = [
		'fill-sort-key',
		'fill-pattern',
		'fill-outline-color',
		'line-sort-key',
		'line-miter-limit',
		'line-round-limit',
		'line-offset',
		'line-pattern',
		'line-gradient',
		'line-translate-anchor',
		'circle-pitch-alignment'
	];

	let layers = $state<any[]>([]);
	let selectedLayer = $state('');

	let paintProps = $state<any>({});
	let layoutProps = $state<any>({});
	let paintValues = $state<any>({});
	let layoutValues = $state<any>({});

	// Watch for map changes to populate the layers dropdown
	$effect(() => {
		const map = mapState.map;
		if (!map) return;

		const updateLayers = () => {
			const style = map.getStyle();
			if (!style || !style.layers) return;

			// Filter for custom GeoJSON layers to exclude background map layers
			layers = style.layers.filter((l: any) => {
				if (!l.source) return false;
				const source = map.getSource(l.source);
				return source && source.type === 'geojson';
			});
		};

		if (map.isStyleLoaded()) {
			updateLayers();
		}

		map.on('styledata', updateLayers);

		return () => {
			map.off('styledata', updateLayers);
		};
	});

	// Watch for changes and update the map automatically
	$effect(() => {
		const map = mapState.map;

		if (!map || !selectedLayer) {
			paintProps = {};
			layoutProps = {};
			return;
		}

		const layer = map.getLayer(selectedLayer);
		if (!layer) return;

		// Load available property schemas from the MapLibre spec for the selected layer type
		const pProps = (v8 as any)[`paint_${layer.type}`] || {};
		const lProps = (v8 as any)[`layout_${layer.type}`] || {};

		paintProps = pProps;
		layoutProps = lProps;
		const newPValues: any = {};
		for (const key in pProps) {
			let val = map.getPaintProperty(selectedLayer, key);
			if (val === undefined) val = pProps[key].default;
			newPValues[key] = val;
		}
		paintValues = newPValues;

		const newLValues: any = {};
		for (const key in lProps) {
			let val = map.getLayoutProperty(selectedLayer, key);
			if (val === undefined) val = lProps[key].default;
			newLValues[key] = val;
		}
		layoutValues = newLValues;
	});

	function handleInput(key: string, prop: any, isPaint: boolean, e: any) {
		let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

		// Handle specific type conversions
		if (prop.type === 'number' && e.target.type !== 'color') {
			val = val === '' ? undefined : Number(val);
		} else if (
			prop.type === 'array' ||
			typeof (isPaint ? paintValues[key] : layoutValues[key]) === 'object'
		) {
			try {
				val = JSON.parse(val);
			} catch {
				// Allow falling back to a string format (e.g., incomplete data-driven expression strings)
			}
		}

		if (isPaint) {
			paintValues[key] = val;
			if (mapState.map && selectedLayer) {
				try {
					mapState.map.setPaintProperty(selectedLayer, key, val);
				} catch (err) {
					console.warn(err);
				}
			}
		} else {
			layoutValues[key] = val;
			if (mapState.map && selectedLayer) {
				try {
					mapState.map.setLayoutProperty(selectedLayer, key, val);
				} catch (err) {
					console.warn(err);
				}
			}
		}
	}

	function rgbaToHex(rgba: any) {
		if (!rgba || typeof rgba !== 'string') return '#000000';
		if (rgba.startsWith('#')) return rgba.slice(0, 7);
		const m = rgba.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
		if (m) {
			return (
				'#' +
				parseInt(m[1]).toString(16).padStart(2, '0') +
				parseInt(m[2]).toString(16).padStart(2, '0') +
				parseInt(m[3]).toString(16).padStart(2, '0')
			);
		}
		return '#000000';
	}
</script>

<div class="space-y-4">
	<!-- Layer Selection -->
	<div class="flex flex-col gap-1">
		<label for="layer-select" class="text-sm font-bold text-neutral-700">Select Data to Style</label
		>
		<select
			id="layer-select"
			bind:value={selectedLayer}
			class="w-full rounded border border-neutral-300 bg-white p-2 text-sm"
		>
			<option value="">-- Choose a layer --</option>
			{#each layers as layer}
				<option value={layer.id}>{layer.name || layer.id}</option>
			{/each}
		</select>
	</div>

	{#if selectedLayer && (Object.keys(layoutProps).length > 0 || Object.keys(paintProps).length > 0)}
		<div class="h-full space-y-4 overflow-y-auto pr-2">
			{#if Object.keys(layoutProps).length > 0}
				<div class="space-y-3 rounded bg-neutral-100 p-3">
					<h3 class="text-sm font-bold text-neutral-800">Layout Properties</h3>
					{#each Object.entries(layoutProps).filter(([key]) => !hiddenProps.includes(key)) as [key, prop]}
						{@render PropertyInput(key, prop, false)}
					{/each}
				</div>
			{/if}

			{#if Object.keys(paintProps).length > 0}
				<div class="space-y-3 rounded bg-neutral-100 p-3">
					<h3 class="text-sm font-bold text-neutral-800">Paint Properties</h3>
					{#each Object.entries(paintProps).filter(([key]) => !hiddenProps.includes(key)) as [key, prop]}
						{@render PropertyInput(key, prop, true)}
					{/each}
				</div>
			{/if}
		</div>
		<div>
			<button
				onclick={() => {
					mapState.removeLayer(selectedLayer);
					selectedLayer = '';
				}}
				class="w-full cursor-pointer rounded bg-red-500 p-1 font-bold text-white uppercase hover:bg-red-600"
				>Remove layer</button
			>
		</div>
	{/if}
</div>

{#snippet PropertyInput(key: string, prop: any, isPaint: boolean)}
	{@const val = isPaint ? paintValues[key] : layoutValues[key]}
	<div class="flex flex-col gap-1 border-b border-neutral-200 pb-2 text-sm last:border-0 last:pb-0">
		<label for={key} class="font-medium text-neutral-700">{key.split('-').join(' ')}</label>

		{#if prop.type === 'color'}
			<div class="flex items-center gap-2">
				<input
					type="color"
					value={rgbaToHex(val)}
					oninput={(e) => handleInput(key, prop, isPaint, e)}
					class="h-8 w-14 cursor-pointer rounded"
				/>
				<input
					type="text"
					id={key}
					value={typeof val === 'object' ? JSON.stringify(val) : (val ?? '')}
					onchange={(e) => handleInput(key, prop, isPaint, e)}
					class="flex-1 rounded border border-neutral-300 bg-white p-1.5 font-mono text-xs"
				/>
			</div>
		{:else if prop.type === 'number'}
			<div class="grid grid-cols-[1fr_7ch] items-center gap-2">
				<input
					type="range"
					id={key}
					min={prop.minimum}
					max={prop.maximum}
					step={prop.maximum && prop.maximum <= 1 ? 0.05 : 0.5}
					value={val ?? ''}
					oninput={(e) => handleInput(key, prop, isPaint, e)}
					class="w-full rounded border border-neutral-300 bg-white p-1.5"
				/>
				<input
					type="number"
					id={key}
					min={prop.minimum}
					max={Infinity}
					step={prop.maximum && prop.maximum <= 1 ? 0.05 : 0.5}
					value={val ?? ''}
					oninput={(e) => handleInput(key, prop, isPaint, e)}
					class="rounded border border-neutral-300 bg-white p-1.5"
				/>
			</div>
		{:else if prop.type === 'boolean'}
			<input
				type="checkbox"
				id={key}
				checked={!!val}
				onchange={(e) => handleInput(key, prop, isPaint, e)}
				class="h-4 w-4 cursor-pointer"
			/>
		{:else if prop.type === 'enum' && prop.values}
			<select
				id={key}
				value={val ?? ''}
				onchange={(e) => handleInput(key, prop, isPaint, e)}
				class="w-full rounded border border-neutral-300 bg-white p-1.5"
			>
				<option value="">-- default --</option>
				{#each Object.keys(prop.values) as opt}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
		{:else if prop.type === 'array'}
			<div class="flex items-center gap-2">
				<input
					type="number"
					min="0"
					step="0.5"
					value={Array.isArray(val) ? val[0] : ''}
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						handleInput(key, prop, isPaint, {
							target: {
								value: JSON.stringify([
									Number(target.value),
									Array.isArray(val) && val[1] !== undefined ? val[1] : 0
								])
							}
						});
					}}
					class="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs"
					placeholder="Dash"
				/>
				<input
					type="number"
					min="0"
					step="0.5"
					value={Array.isArray(val) ? val[1] : ''}
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						handleInput(key, prop, isPaint, {
							target: {
								value: JSON.stringify([
									Array.isArray(val) && val[0] !== undefined ? val[0] : 0,
									Number(target.value)
								])
							}
						});
					}}
					class="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs"
					placeholder="Gap"
				/>
			</div>
		{:else if prop.type === 'array'}
			<input
				type="text"
				id={key}
				value={typeof val === 'object' ? JSON.stringify(val) : (val ?? '')}
				onchange={(e) => handleInput(key, prop, isPaint, e)}
				class="w-full rounded border border-neutral-300 bg-white p-1.5 font-mono text-xs"
			/>
		{:else}
			<input
				type="text"
				id={key}
				value={typeof val === 'object' ? JSON.stringify(val) : (val ?? '')}
				onchange={(e) => handleInput(key, prop, isPaint, e)}
				class="w-full rounded border border-neutral-300 bg-white p-1.5 font-mono text-xs"
			/>
		{/if}

		{#if prop.doc}
			<span class="text-[10px] leading-tight text-neutral-500">{prop.doc}</span>
		{/if}
	</div>
{/snippet}
