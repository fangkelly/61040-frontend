<script setup lang="ts">
import MapComponent from "@/components/Map/MapComponent.vue";
import { computed, ref } from "vue";
const emit = defineEmits(["updateComposedTrail", "update:nameValue", "update:DescriptionValue"]);
const props = defineProps(["nameValue", "descriptionValue", "locations"]);

// location: list of coordinates {lat, lng}
let trail = ref(props.locations);

let distance = ref(0);
let duration = ref(0);

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

const trailList = computed(() => {
  return [{ locations: trail.value }];
});

const updateTrail = (value, index, field) => {
  const newTrail = [...trail.value];
  newTrail[index][field] = value;
  trail.value = newTrail;

  emit("updateComposedTrail", trail);
};

const updateTrailName = () => {
  emit("updateTrailName", name);
};

const updateTrailDescription = () => {
  emit("updateTrailDescription", description);
};

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
    <v-col class="trail-fields-container" cols="6">
      <!-- <input v-model="name" /> -->
      <v-text-field v-model="name" label="Trail name" color="#95b08d" variant="outlined" :rules="nameRules" />
      <v-text-field v-model="description" label="Trail description" color="#95b08d" variant="outlined" :rules="descriptionRules" />

      <v-divider></v-divider>

      <div class="location-container">
        <div v-for="(location, counter) in trail" v-bind:key="counter">
          <div class="location-label">
            <p>Location {{ counter + 1 }}</p>
            <v-icon v-if="trail.length > 1" size="x-small" @click="deleteItem(counter)">mdi-close</v-icon>
          </div>
          <div class="location-entry">
            <v-text-field
              @update:modelValue="(value) => updateTrail(value, counter, 'lat')"
              v-model="location.lat"
              v-bind:label="`Latitude`"
              color="#95b08d"
              variant="outlined"
              :rules="latitiudeRules"
            />
            <v-text-field
              @update:modelValue="(value) => updateTrail(value, counter, 'lng')"
              v-model="location.lng"
              v-bind:label="`Longitude`"
              color="#95b08d"
              variant="outlined"
              :rules="longitudeRules"
            />
          </div>
        </div>

        <button id="add-item-btn" @click="addItem" type="button">Add another location <v-icon size="x-small">mdi-plus</v-icon></button>
      </div>
    </v-col>

    <v-divider vertical />
    <v-col class="trail-fields-container">
      <div class="map-container">
        <MapComponent :trails="trailList" @updateDistanceTime="updateDistanceTime" :draggable="true" @updateMarkerLocation="updateMarkerLocation" />
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
