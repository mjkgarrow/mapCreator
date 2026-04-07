<script>
	let { title, elementNum, open = false, children } = $props();
</script>

<details class="group h-full" {open}>
	<summary
		class="flex cursor-pointer list-none items-center bg-neutral-200 p-2 hover:bg-neutral-300"
	>
		<!-- {@html title} -->
		<div class="flex items-center gap-2">
			{#if elementNum}
				<div
					class="flex aspect-square w-8 items-center justify-center rounded-full bg-neutral-500 text-xl font-bold text-white"
				>
					{elementNum}
				</div>
			{/if}
			<p class="!m-0 font-bold">{@html title}</p>
		</div>

		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="ml-auto inline transition-transform duration-300 ease-in-out group-open:rotate-180"
		>
			<path d="m18 15-6-6-6 6" />
			<!-- <path d="m6 9 6 6 6-6" /> -->
		</svg>
	</summary>
	{@render children()}
</details>

<style>
	details {
		interpolate-size: allow-keywords; /* Enables height: auto transitions */
	}

	details::details-content {
		block-size: 0;
		overflow: hidden;
		transition:
			block-size 300ms ease-in-out,
			content-visibility 300ms ease-in-out allow-discrete;
	}

	details[open]::details-content {
		opacity: 1;
		block-size: auto;
		/* border-color: rgb(115 115 115); */
	}
</style>
