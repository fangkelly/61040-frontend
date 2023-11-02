<script setup lang="ts">
import EventPreviewComponent from "@/components/Event/EventPreviewComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import MapInteractiveComponent from "../components/Map/MapInteractiveComponent.vue";
import { filterFutureDateTime, sortAscendingDateTime } from "../utils/formatDate";
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());

const props = defineProps(["username"]);
const username = "kfang";
const loaded = ref(false);

let upcomingEvents = ref([]);
// let pinnedTrails = ref<Array<Record<string, string>>>([]);
let allTrails = ref<Array<Record<string, string>>>([]); // all of the user's trail TODO: use store to get this value

async function getUpcomingEvents() {
  console.log("in get upcoming events");
  let registeredEvents;
  try {
    console.log("here");
    registeredEvents = await fetchy(`/api/events/registered`, "GET", { query: { user: username } });
    console.log("registeredEvents ", registeredEvents);
  } catch (_) {
    return;
  }

  const sortedRegisteredEvents = sortAscendingDateTime(registeredEvents);
  const futureRegisteredEvents = filterFutureDateTime(sortedRegisteredEvents);
  upcomingEvents.value = futureRegisteredEvents;
  console.log("upcoming events ", futureRegisteredEvents);
}

async function getAllTrails() {
  console.log("getAllTrails");
  let usersTrails;
  try {
    usersTrails = await fetchy(`api/trails/`, "GET", { query: { author: username } });
  } catch (_) {
    return;
  }
  allTrails.value = usersTrails;
  console.log("allTrails ", usersTrails);

  // pinnedTrails.value = usersTrails.filter((trail) => trail.pinned);
}

onBeforeMount(async () => {
  console.log("onBeforeMount");
  await getUpcomingEvents();
  await getAllTrails();
  loaded.value = true;
});

function updateTrailWithPost(trailId: string, postIndex: number, newLocations: Array<{ lat: number; lng: number; post?: string }>) {
  console.log("in updateTrailWithPost");

  // find index of the trail to update
  const trailIndex = allTrails.value.findIndex((t) => t._id.toString() === trailId.toString());

  console.log("postIndex", postIndex);
  // get the trail to update
  let updatedTrail = allTrails.value[trailIndex];
  console.log("trailIndex ", trailIndex);
  console.log("updatedTrail ", updatedTrail);
  console.log("new locations ", newLocations);

  // change the location of the trail
  updatedTrail.locations = newLocations;

  // copy of all the trails
  const newTrails = [...allTrails.value];

  // replace the trail with the new trail
  newTrails.splice(trailIndex, 1, updatedTrail);
  console.log("newTrails ", newTrails);
  allTrails.value = newTrails;
}

function updateTrailWithoutPost(trailId, postIndex) {
  // find index of the trail to update
  const trailIndex = allTrails.value.findIndex((t) => t._id.toString() === trailId.toString());

  // get the trail to update
  let updatedTrail = allTrails.value[trailIndex];
  console.log("updatedTrail ", updatedTrail);

  // get the location of the trail
  const location = updatedTrail.locations[postIndex];
  console.log("location ", location);

  // update the post of the location to undefined
  location.post = undefined;

  // copy of all the trails
  const newTrails = [...allTrails.value];

  // replace the trail with the new trail
  newTrails.splice(trailIndex, 1, updatedTrail);
  console.log("newTrails ", newTrails);
  allTrails.value = newTrails;
}
</script>

<template>
  <main id="profile-container">
    <section id="profile-section">
      <div id="avatar-container">
        <img id="avatar-img" src="https://via.placeholder.com/100x100/cf5" />
        <!-- <input type="file" /> -->
      </div>
      <h1>{{ username }}</h1>
    </section>

    <section>
      <h3>Upcoming Trails</h3>
      <div>
        <div v-if="upcomingEvents.length > 0" id="upcoming-trails-list" class="row">
          <article v-for="event in upcomingEvents" :key="event._id">
            <EventPreviewComponent :event="event" />
          </article>
        </div>

        <!-- TODO: REDIRECT TO EVENT EXPLORATION -->
        <div v-else>No upcoming events. Explore <a>events</a></div>
      </div>
    </section>

    <!-- <section>
      <h3>Pinned Trails</h3>
      <div class="row">
        <article v-for="pinned in pinnedTrails" :key="pinned._id">
          <v-sheet class="pinned-thumbnail"> {{ pinned.name }} </v-sheet>
        </article>

        <article v-for="x in Array(5 - pinnedTrails.length).keys()" :key="x">
          <v-sheet class="pinned-thumbnail add-pinned-button">
            <v-icon color="white">mdi-plus</v-icon>
          </v-sheet>
        </article>
      </div>
    </section> -->

    <section>
      <h3>All Trails</h3>
      <div class="map-container">
        <MapInteractiveComponent mapRef="profile-map-container" :trails="allTrails" @updateTrailWithPost="updateTrailWithPost" @updateTrailWithoutPost="updateTrailWithoutPost" />
      </div>
    </section>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  row-gap: 4em;
  padding: 2em;
}

h1,
h2,
h3 {
  color: white;
}

.pinned-thumbnail {
  border-radius: 25px;
  width: calc((100vw - 8em) / 5);
  aspect-ratio: 1;
}

.add-pinned-button {
  background-color: rgba(0, 0, 0, 0);
  border: 1px dashed white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.row {
  display: flex;
  flex-direction: row;
  column-gap: 1em;
}

#upcoming-trails-list {
  width: 100%;
  overflow-x: scroll;
}

#profile-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #95b08d;
}

#profile-section {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  column-gap: 30px;
}

#avatar-container {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
}

#avatar-img {
  transition: opacity 0.3s;
  opacity: 1;
  object-fit: cover;
  border-radius: 50%;
  height: 100%;
  width: 100%;
}

#avatar-img:hover {
  opacity: 0.4;
}

.map-container {
  position: relative;
  height: 95vh;
}
</style>
