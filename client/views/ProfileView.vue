<script setup lang="ts">
import EventPreviewComponent from "@/components/Event/EventPreviewComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import MapInteractiveComponent from "../components/Map/MapInteractiveComponent.vue";
import { useFriendStore } from "../stores/friend";
import { filterFutureDateTime, sortAscendingDateTime } from "../utils/formatDate";
const { friends, requests } = storeToRefs(useFriendStore());
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const friendStore = useFriendStore();

const props = defineProps(["username"]);
const username = "kfang";
const loaded = ref(false);

const friendshipStatus = computed(() => {
  const friendship = requests.value.find((req) => req.to === username && req.from === currentUsername.value);
  if (friendship) {
    return friendship.status;
  } else {
    return friendship;
  }
});

let upcomingEvents = ref([]);
// let pinnedTrails = ref<Array<Record<string, string>>>([]);
let allTrails = ref<Array<Record<string, string>>>([]); // all of the user's trail TODO: use store to get this value

async function getUpcomingEvents() {
  let registeredEvents;
  try {
    registeredEvents = await fetchy(`/api/events/registered`, "GET", { query: { user: username } });
  } catch (_) {
    return;
  }

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
}

onBeforeMount(async () => {
  console.log("onBeforeMount");
  await getUpcomingEvents();
  await getAllTrails();
  loaded.value = true;
});

function updateTrailWithPost(trailId: string, postIndex: number, newLocations: Array<{ lat: number; lng: number; post?: string }>) {
  // find index of the trail to update
  const trailIndex = allTrails.value.findIndex((t) => t._id.toString() === trailId.toString());

  // get the trail to update
  let updatedTrail = allTrails.value[trailIndex];

  // change the location of the trail
  updatedTrail.locations = newLocations;

  // copy of all the trails
  const newTrails = [...allTrails.value];

  // replace the trail with the new trail
  newTrails.splice(trailIndex, 1, updatedTrail);
  allTrails.value = newTrails;
}

function updateTrailWithoutPost(trailId, postIndex) {
  // find index of the trail to update
  const trailIndex = allTrails.value.findIndex((t) => t._id.toString() === trailId.toString());

  // get the trail to update
  let updatedTrail = allTrails.value[trailIndex];

  // get the location of the trail
  const location = updatedTrail.locations[postIndex];

  // update the post of the location to undefined
  location.post = undefined;

  // copy of all the trails
  const newTrails = [...allTrails.value];

  // replace the trail with the new trail
  newTrails.splice(trailIndex, 1, updatedTrail);
  allTrails.value = newTrails;
}

async function handleRemoveFriend(username) {
  await friendStore.removeFriend(username);
  await friendStore.updateFriends();
}

async function handleSendRequest(username) {
  await friendStore.sendFriendRequest(username);
  await friendStore.updateRequests();
}

async function handleRemoveRequest(username) {
  await friendStore.removeFriendRequest(username);
  await friendStore.updateRequests();
}
</script>

<template>
  <main id="profile-container">
    <div v-if="loaded" class="col">
      <section id="profile-section">
        <div id="avatar-container">
          <img id="avatar-img" src="https://via.placeholder.com/100x100/cf5" />
          <!-- <input type="file" /> -->
        </div>
        <div>
          <h1>{{ username }}</h1>
          <!-- If the user is friends with the profile owner -->
          <button v-if="friends.includes(currentUsername)" @click="handleRemoveFriend(username)">Remove Friend</button>

          <!-- If the user send a request to the profile owner -->
          <button v-else-if="friendshipStatus === `pending`" @click="handleRemoveFriend(username)">
            <p>Remove Friend Request</p>
          </button>

          <!-- If the user has not sent a request or a request has been rejected -->
          <button v-else-if="username !== currentUsername" @click="handleSendRequest(username)">Send Friend Request</button>
        </div>
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

      <section>
        <h3>All Trails</h3>
        <div class="map-container">
          <MapInteractiveComponent mapRef="profile-map-container" :trails="allTrails" @updateTrailWithPost="updateTrailWithPost" @updateTrailWithoutPost="updateTrailWithoutPost" />
        </div>
      </section>
    </div>

    <div v-else class="load-container"><v-progress-circular color="white" indeterminate></v-progress-circular></div>
  </main>
</template>

<style scoped>
.load-container {
  flex: 1;
  margin: auto;
  height: 100vh;
}
section > h3 {
  padding-bottom: 1em;
}

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
  flex: 1;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 2em;
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
