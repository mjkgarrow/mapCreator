<script>
	let { accept = '*', onfile, showPaste = false, onpastetext } = $props();

	let pastedText = $state('');

	function handleChange(event) {
		const input = event.target;
		if (!input.files?.length) return;

		onfile(input.files[0]);

		// Reset input so the same file can be selected again if needed
		input.value = '';
	}

	function handlePaste() {
		if (onpastetext && pastedText.trim()) {
			onpastetext(pastedText);
			pastedText = ''; // Clear after submitting
		}
	}
</script>

<div class="flex gap-2">
	<!-- Wrapping the input in a label inherently links them without needing a unique ID -->
	<label class="cursor-pointer rounded-sm bg-neutral-200 px-2 py-1 hover:bg-neutral-300">
		Select file
		<input type="file" {accept} class="hidden" onchange={handleChange} />
	</label>

	{#if showPaste}
		<input
			type="text"
			bind:value={pastedText}
			onchange={handlePaste}
			placeholder="or paste here"
			class="grow rounded-sm border border-neutral-200 bg-neutral-100 px-2 py-1 placeholder:italic"
		/>
	{/if}
</div>
