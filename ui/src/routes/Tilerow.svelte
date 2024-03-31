<script>
    import Tile from "./Tile.svelte";

    let num_rows = 5
    let list = new Array(num_rows);

</script>

<div class="flex flex-col">
    {#each list as someItem}
        <Tile/>
    {/each}
</div>