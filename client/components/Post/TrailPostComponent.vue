<script setup lang="ts">
const props = defineProps(["selectedTrail", "postIndex"]);
console.log("selectedTrail ", props.selectedTrail);
</script>

<template>
  <v-sheet rounded class="post-sheet">
    <h3>{{ selectedTrail.name }}</h3>
    <h4>{{ selectedTrail.author }}</h4>
    <h6>{{ selectedTrail.distance }} miles</h6>
    <h6>{{ selectedTrail.duration }} hours</h6>

    <v-divider class="divider"></v-divider>
  </v-sheet>
</template>

<style scoped>
.post-sheet {
  position: absolute;
  top: 2em;
  right: 2em;
  padding: 1em;
  width: 40%;
  height: calc(100% - 4em);
}

.divider {
  margin: 1em 0;
}
</style>
