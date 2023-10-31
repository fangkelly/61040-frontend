<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps(["loc", "counter"]);
const emit = defineEmits(["updateMarkerLocation"]);

let locRef = ref(props.loc);

watch(
  locRef,
  (newVal, oldVal) => {
    emit("updateMarkerLocation", { ...newVal, index: props.counter });
  },
  {
    deep: true,
  },
);

const longitudeRules = [
  (c) => {
    if (!isNaN(c) && !isNaN(parseFloat(c))) {
      return true;
    }
    return "Coordinate must be a number!";
  },
  (c) => {
    if (Math.abs(parseFloat(c)) <= 180) {
      return true;
    }
    return "Latitude must be between -180 and 180!";
  },
];

const latitiudeRules = [
  (c) => {
    if (!isNaN(c) && !isNaN(parseFloat(c))) {
      return true;
    }
    return "Coordinate must be a number!";
  },
  (c) => {
    if (Math.abs(parseFloat(c)) <= 90) {
      return true;
    }
    return "Latitude must be between -90 and 90!";
  },
];
</script>

<template>
  <div class="location-entry">
    <v-text-field v-model="locRef.lat" v-bind:label="`Latitude`" color="#95b08d" variant="outlined" :rules="latitiudeRules" />
    <v-text-field v-model="locRef.lng" v-bind:label="`Longitude`" color="#95b08d" variant="outlined" :rules="longitudeRules" />
  </div>
</template>

<style scoped>
.location-entry {
  display: flex;
  flex-direction: row;
  align-items: center;
  column-gap: 0.5em;
  width: 100%;
  padding-bottom: 1em;
}
.location-entry > * {
  width: 50%;
}
</style>
