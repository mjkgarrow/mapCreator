import { setContext, getContext } from 'svelte';
import maplibregl from 'maplibre-gl';
import baseStyle from '../lib/assets/baseStyle.json';
import * as topojson from 'topojson-client';

export class MapCreatorState {
	// We use $state.raw because MapLibre objects are complex and shouldn't be deeply tracked by Svelte
	map = $state.raw<maplibregl.Map | null>(null);
	featureCount = 0;

	initMap(container: HTMLElement) {
		this.map = new maplibregl.Map({
			container,
			style: baseStyle, // OpenFreeMap default style
			// style: 'https://tiles.openfreemap.org/styles/positron', // OpenFreeMap default style
			center: [50, 30],
			zoom: 3,
			maxPitch: 90,
			preserveDrawingBuffer: true
		});

		this.map.on('load', () => {
			if (!this.map) return;

			// Check if a background layer already exists
			const style = this.map.getStyle();
			const hasBackground = style.layers.some((l) => l.type === 'background');

			if (!hasBackground) {
				this.map.addLayer(
					{
						id: 'base-background',
						type: 'background',
						paint: { 'background-color': '#ffffff' }
					},
					style.layers[0]?.id
				); // Insert at the very bottom
			}
		});
	}

	addGeoJSON(data: any) {
		if (!this.map || !data) return;

		let geojson = data;

		// Convert TopoJSON to GeoJSON if necessary
		if (data.type === 'Topology' && data.objects) {
			const features: any[] = [];
			for (const key in data.objects) {
				const converted = topojson.feature(data, data.objects[key]) as any;
				if (converted.type === 'FeatureCollection') {
					features.push(...converted.features);
				} else if (converted.type === 'Feature') {
					features.push(converted);
				}
			}
			geojson = { type: 'FeatureCollection', features };
		}

		if (!geojson.features) return;

		geojson.features.forEach((feature: any, index: number) => {
			const geometryType = feature.geometry?.type;
			if (!geometryType) return;

			// Create a unique ID for every single feature
			const uniqueId = `feature-${this.featureCount}`;
			// const uniqueId = `feature-${Date.now()}-${index}`;

			// Each feature must be its own source to be styled as a separate layer
			this.map.addSource(uniqueId, {
				type: 'geojson',
				data: feature
			});

			if (geometryType.includes('Polygon')) {
				this.map.addLayer({
					id: `${uniqueId}-fill`,
					type: 'fill',
					source: uniqueId,
					paint: {
						'fill-color': '#000000',
						'fill-opacity': 0.5
						// 'fill-outline-color': 'none'
					}
				});
				this.map.addLayer({
					id: `${uniqueId}-line`,
					type: 'line',
					source: uniqueId,
					paint: {
						'line-color': '#000000',
						'line-opacity': 1,
						'line-width': 2
					}
				});
			} else if (geometryType.includes('LineString') || geometryType.includes('MultiLineString')) {
				this.map.addLayer({
					id: `${uniqueId}-line`,
					type: 'line',
					source: uniqueId,
					paint: {
						'line-color': '#000000',
						'line-width': 3
					}
				});
			} else if (geometryType.includes('Point')) {
				this.map.addLayer({
					id: `${uniqueId}-point`,
					type: 'circle',
					source: uniqueId,
					paint: {
						'circle-radius': 6,
						'circle-color': '#000000',
						'circle-stroke-width': 2,
						'circle-stroke-color': '#ffffff'
					}
				});
			}

			this.featureCount += 1;
		});
	}

	addStyle(style: string) {
		if (!this.map) return;
		this.map.setStyle(style);
	}

	removeLayer(layerId: string) {
		if (!this.map) return;
		this.map.removeLayer(layerId);
	}

	exportImage() {
		const map = this.map;
		if (!map) return;

		// A helper to perform the actual canvas manipulation
		const download = () => {
			const mapCanvas = map.getCanvas();
			const tempCanvas = document.createElement('canvas');

			// Use the display size (CSS pixels) or the actual render size
			tempCanvas.width = mapCanvas.width;
			tempCanvas.height = mapCanvas.height;
			const ctx = tempCanvas.getContext('2d');

			if (ctx) {
				// 1. Fill background (ensures no transparency)
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

				// 2. Draw the map
				ctx.drawImage(mapCanvas, 0, 0);

				// 3. Trigger Download
				const link = document.createElement('a');
				link.download = `map-${Date.now()}.png`;
				link.href = tempCanvas.toDataURL('image/png');
				link.click();
				tempCanvas.remove();
			}
		};

		// If map is still loading tiles, wait for it to be 'idle'
		if (!map.loaded()) {
			map.once('idle', download);
		} else {
			// Force a repaint to ensure buffer is fresh, then download
			map.triggerRepaint();
			map.once('render', download);
		}
	}

	async exportHighRes(width: number, height: number) {
		const currentMap = this.map;
		if (!currentMap) return;

		// 1. Create a hidden container with the target dimensions
		const hiddenContainer = document.createElement('div');
		hiddenContainer.style.width = `${width}px`;
		hiddenContainer.style.height = `${height}px`;
		hiddenContainer.style.position = 'absolute';
		hiddenContainer.style.left = '-9999px'; // Hide from view
		hiddenContainer.style.top = '-9999px';
		document.body.appendChild(hiddenContainer);

		// 2. Initialize a "Ghost Map" with identical settings
		const dumpMap = new maplibregl.Map({
			container: hiddenContainer,
			style: currentMap.getStyle(),
			center: currentMap.getCenter(),
			zoom: currentMap.getZoom(),
			bearing: currentMap.getBearing(),
			pitch: currentMap.getPitch(),
			interactive: false,
			preserveDrawingBuffer: true,
			fadeDuration: 0 // Disable transitions for instant capture
		});

		// 3. Wait for the ghost map to finish loading all tiles
		dumpMap.once('idle', () => {
			const canvas = dumpMap.getCanvas();

			// Flatten with background to prevent transparency
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = width;
			tempCanvas.height = height;
			const ctx = tempCanvas.getContext('2d');

			if (ctx) {
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(canvas, 0, 0);

				const link = document.createElement('a');
				link.download = `map-export-${width}x${height}-${Date.now()}.png`;
				link.href = tempCanvas.toDataURL('image/png');
				link.click();
			}

			// 4. Cleanup
			dumpMap.remove();
			hiddenContainer.remove();
		});
	}

	destroy() {
		this.map?.remove();
	}
}

const MAP_CTX = Symbol('MAP_CTX');

export function setMapState() {
	const state = new MapCreatorState();
	setContext(MAP_CTX, state);
	return state;
}

export function getMapState() {
	return getContext<MapCreatorState>(MAP_CTX);
}
