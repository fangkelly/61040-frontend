<script setup lang="ts">
import EventPreviewComponent from "@/components/Event/EventPreviewComponent.vue";
import TrailPostComponent from "@/components/Post/TrailPostComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import MapInteractiveComponent from "../components/Map/MapInteractiveComponent.vue";
import { filterFutureDateTime, sortAscendingDateTime } from "../utils/formatDate";
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());

const username = currentUsername.value;

const loaded = ref(false);

let upcomingEvents = ref<Array<Record<string, string>>>([]);
// let pinnedTrails = ref<Array<Record<string, string>>>([]);
let allTrails = ref<Array<Record<string, string>>>([]); // all of the user's trail TODO: use store to get this value
let postValue = ref(-1); // index of post picked from map
let trailValue = ref(); // id of trail picked from map

const selectedTrail = computed(() => {
  return allTrails.value.find((trail) => trail._id.toString() === trailValue.value.toString());
});

const accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

async function getUpcomingEvents() {
  let registeredEvents;
  try {
    registeredEvents = await fetchy(`api/events/registered`, "GET", { query: { user: username } });
  } catch (_) {
    return;
  }

  // TODO: filter registeredEvents for those that are occuring in the future (ie. do not display past events)
  const sortedRegisteredEvents = sortAscendingDateTime(registeredEvents);
  const futureRegisteredEvents = filterFutureDateTime(sortedRegisteredEvents);
  upcomingEvents.value = futureRegisteredEvents;
}

async function getAllTrails() {
  let usersTrails;
  try {
    usersTrails = await fetchy(`api/trails/`, "GET", { query: { author: username } });
  } catch (_) {
    return;
  }
  allTrails.value = usersTrails;
  // pinnedTrails.value = usersTrails.filter((trail) => trail.pinned);
}

onBeforeMount(async () => {
  await getUpcomingEvents();
  await getAllTrails();
  loaded.value = true;
});
</script>

<template>
  <main id="profile-container">
    <section id="profile-section">
      <div id="avatar-container">
        <img id="avatar-img" src="https://via.placeholder.com/100x100/cf5" />
        <!-- <input type="file" /> -->
      </div>
      <h1>{{ currentUsername }}</h1>
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
        <MapInteractiveComponent
          mapRef="profile-map-container"
          :trails="allTrails"
          :postValue="postValue"
          :trailValue="trailValue"
          @updatePostValue="
            (v) => {
              console.log('POST VALUE CHANGED ', v);
              postValue = v;
            }
          "
          @updateTrailValue="
            (v) => {
              trailValue = v;
            }
          "
        />
        <TrailPostComponent
          v-if="postValue > -1"
          :postIndex="postValue"
          :selectedTrail="selectedTrail"
          @updatePostValue="
            (v) => {
              console.log('POST VALUE CHANGED ', v);
              postValue = v;
            }
          "
        />
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
  height: 90vh;
}
</style>
