<script>
    import Tilerow from './Tilerow.svelte'
    let num_cols = 9
    let list = new Array(num_cols);
</script>

<div class="flex flex-row">
    {#each list as someItem}
        <Tilerow/>
    {/each}
</div>