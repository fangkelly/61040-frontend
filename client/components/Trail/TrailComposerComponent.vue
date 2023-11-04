<script setup lang="ts">
// @ts-nocheck
import MapVisualizerComponent from "@/components/Map/MapVisualizerComponent.vue";
import LocationEntryComponent from "@/components/Trail/LocationEntryComponent.vue";
import { computed } from "vue";
const emit = defineEmits(["update:trailValue", "update:nameValue", "update:descriptionValue", "update:distanceValue", "update:durationValue", "update:correctedTrailValue"]);
const props = defineProps(["nameValue", "descriptionValue", "trailValue", "distanceValue", "durationValue"]);

const distance = computed({
  get() {
    return props.distanceValue;
  },
  set(value) {
    emit("update:distanceValue", value);
  },
});

const duration = computed({
  get() {
    return props.durationValue;
  },
  set(value) {
    emit("update:durationValue", value);
  },
});

const name = computed({
  get() {
    return props.nameValue;
  },
  set(value) {
    emit("update:nameValue", value);
  },
});

const description = computed({
  get() {
    return props.descriptionValue;
  },
  set(value) {
    emit("update:descriptionValue", value);
  },
});

const trail = computed({
  get() {
    return props.trailValue;
  },
  set(value) {
    emit("update:trailValue", value);
  },
});

const trailList = computed(() => {
  return [{ locations: trail.value }];
});

const updateTrail = (value, index, field) => {
  const newTrail = [...trail.value];
  newTrail[index][field] = value;
  trail.value = newTrail;

  emit("update:trailValue", trail.value);
};

const nameRules = [
  (v) => {
    if (v) return true;
    return "You must enter a name for your trail";
  },
];

const descriptionRules = [
  (v) => {
    if (v) return true;
    return "You must enter a name for your description";
  },
];

function deleteItem(idx: number) {
  const newTrail = trail.value.toSpliced(idx, 1);
  trail.value = newTrail;
}

function addItem() {
  trail.value = [
    ...trail.value,
    {
      lng: "",
      lat: "",
    },
  ];
}

function updateDistanceTime(info) {
  distance.value = info.distance;
  duration.value = info.duration;
}

function updateMarkerLocation(update) {
  updateTrail(update.lng, update.index, "lng");
  updateTrail(update.lat, update.index, "lat");
}
</script>

<template>
  <v-row class="trail-form-row">
    <v-col class="trail-fields-container" md="6">
      <!-- <input v-model="name" /> -->
      <v-text-field v-model="name" label="Trail name" color="#95b08d" variant="outlined" :rules="nameRules" />
      <v-text-field v-model="description" label="Trail description" color="#95b08d" variant="outlined" :rules="descriptionRules" />

      <v-divider></v-divider>

      <div class="location-container">
        <div v-for="(loc, counter) in trail" v-bind:key="counter">
          <div class="location-label">
            <p>Location {{ counter + 1 }}</p>
            <v-icon v-if="trail.length > 1" size="x-small" @click="deleteItem(counter)">mdi-close</v-icon>
          </div>

          <LocationEntryComponent :loc="loc" :counter="counter" @update-coordinate="updateTrail" @updateMarkerLocation="updateMarkerLocation" />
        </div>

        <button id="add-item-btn" @click="addItem" type="button">Add another location <v-icon size="x-small">mdi-plus</v-icon></button>
      </div>
    </v-col>

    <v-divider vertical />
    <v-col class="trail-fields-container" md="6">
      <small>Add locations and drag them on the map to create your trail. Trails will automatically be corrected to follow existing trails in real life!</small>

      <div class="map-container">
        <MapVisualizerComponent
          mapRef="trail-composer-map"
          :trails="trailList"
          @updateDistanceTime="updateDistanceTime"
          :draggable="true"
          @updateMarkerLocation="updateMarkerLocation"
          @updateCorrectedTrail="
            (trail) => {
              emit(`update:correctedTrailValue`, trail);
            }
          "
        />
      </div>
      <v-divider></v-divider>

      <p>Estimated distance: {{ distance }} miles</p>
      <p>Estimated duration: {{ duration }} hours</p>
    </v-col>
  </v-row>
</template>

<style scoped>
.location-container {
  height: 300px;
  overflow-y: scroll;
}
.location-label {
  padding-bottom: 1em;
  display: flex;
  flex-direction: row;
  column-gap: 0.5em;
  align-items: center;
  justify-content: space-between;
}

.trail-fields-container {
  display: flex;
  flex-direction: column;
  row-gap: 1em;
}

.map-container {
  position: relative;
  height: 50vh;
}

button {
  border: 1px solid #474747;
  color: #474747;
  font-size: 12px;
  font-weight: 100;
  cursor: pointer;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 0.25em;
}

button > * {
  margin: 0;
}

input {
  padding: 0;
  min-height: 0;
}

.trail-form-row {
  column-gap: 0.5em;
}

#add-item-btn {
  margin: auto;
}
</style>
