<script setup lang="ts">
// @ts-nocheck
import EventPreviewComponent from "@/components/Event/EventPreviewComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { computed, defineProps, onBeforeMount, ref } from "vue";
import MapInteractiveComponent from "../components/Map/MapInteractiveComponent.vue";
import { useFriendStore } from "../stores/friend";
import { filterFutureDateTime, sortAscendingDateTime } from "../utils/formatDate";
const { friends, requests } = storeToRefs(useFriendStore());
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const friendStore = useFriendStore();

const props = defineProps(["user"]);
const loaded = ref(false);

const friendshipStatus = computed(() => {
  const friendship = requests.value.find((req) => req.to === props.user && req.from === currentUsername.value);
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
    registeredEvents = await fetchy(`/api/events/registered`, "GET", { query: { user: props.user } });
  } catch (_) {
    return;
  }

  const sortedRegisteredEvents = sortAscendingDateTime(registeredEvents);
  const futureRegisteredEvents = filterFutureDateTime(sortedRegisteredEvents);
  upcomingEvents.value = futureRegisteredEvents;
  console.log("upcoming events ", upcomingEvents);
}

async function getAllTrails() {
  let usersTrails;
  try {
    usersTrails = await fetchy(`/api/trails/`, "GET", { query: { author: props.user, event: false } });
  } catch (_) {
    return;
  }
  const filteredOutEvents = usersTrails.filter((t) => !t.event);
  allTrails.value = filteredOutEvents;
  console.log("allTrails ", filteredOutEvents);
}

onBeforeMount(async () => {
  await getUpcomingEvents();
  await getAllTrails();
  loaded.value = true;
});

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
        <div class="row">
          <h1>{{ props.user }}</h1>
          <!-- If the user is friends with the profile owner -->
          <button v-if="friends.includes(currentUsername)" @click="handleRemoveFriend(props.user)">Remove Friend</button>

          <!-- If the user send a request to the profile owner -->
          <button v-else-if="friendshipStatus === `pending`" @click="handleRemoveRequest(props.user)">
            <p>Remove Friend Request</p>
          </button>

          <!-- If the user has not sent a request or a request has been rejected -->
          <button v-else-if="props.user !== currentUsername" @click="handleSendRequest(props.user)">Send Friend Request</button>
        </div>
        <div class="row">
          <p>{{ allTrails.length }} trails hiked</p>
          <v-icon color="white" size="x-small">mdi-asterisk</v-icon>
          <p>
            {{ parseInt(allTrails.reduce((accumulator, currentValue) => accumulator + currentValue.distance, 0)).toFixed(2) }}
            miles hiked
          </p>
          <v-icon color="white" size="x-small">mdi-asterisk</v-icon>
          <p>
            {{ parseInt(allTrails.reduce((accumulator, currentValue) => accumulator + currentValue.duration, 0)).toFixed(2) }}
            hours hiked
          </p>
        </div>
      </section>

      <section>
        <h3>Upcoming Events</h3>
        <div>
          <div v-if="upcomingEvents.length > 0" id="upcoming-trails-list" class="row">
            <article v-for="event in upcomingEvents" :key="event._id">
              <EventPreviewComponent :event="event" />
            </article>
          </div>

          <!-- TODO: REDIRECT TO EVENT EXPLORATION -->
          <div class="empty" v-else>No upcoming events!</div>
        </div>
      </section>

      <section>
        <div>
          <h3>All Trails</h3>
          <p v-if="props.user === currentUsername">Drag the points to reformat your trail. The API will reposition your points and compute a route based on what footpaths exist in the real world!</p>
          <p v-else>See where {{ props.user }} has been! Click on a point to see what {{ props.user }} posted at that location.</p>
        </div>
        <div class="map-container">
          <MapInteractiveComponent mapRef="profile-map-container" :trails="allTrails" @refreshTrails="getAllTrails" />
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
p,
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

.empty {
  color: white;
  padding: 2em;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.348);
}

.row {
  display: flex;
  flex-direction: row;
  column-gap: 1em;
  align-items: center;
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

button {
  border: 1px solid white;
  background-color: rgb(0, 0, 0, 0);
  color: white;
  font-size: 12px;
  font-weight: 100;
  cursor: pointer;
  width: max-content;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.5em 2em;
}

button:hover {
  background-color: white;
  color: #95b08d;
  border: 1px solid #95b08d;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 2em;
}

#profile-section {
  display: flex;
  flex-direction: column;
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
