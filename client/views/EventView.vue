<script setup lang="ts">
import Tag from "@/components/Event/TagComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import AttendeeCard from "../components/Event/AttendeeCardComponent.vue";
import EventFeedComponent from "../components/Event/EventFeedComponent.vue";
import MapVisualizerComponent from "../components/Map/MapVisualizerComponent.vue";
import { fetchy } from "../utils/fetchy";
import { abbreviateMonth, formatTime } from "../utils/formatDate";
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());

const props = defineProps(["id"]);

let loaded = ref(false);
let event = ref(undefined);
let attendees = ref();
let registered = ref(false);
let trail = ref([]);

async function getEvent() {
  const fetchedEvent = await fetchy("/api/events/", "GET", { query: { _id: props.id } });
  event.value = fetchedEvent[0];

  if (fetchedEvent[0]) {
    await getEventTrail(fetchedEvent[0].trail);
  }
}

async function getEventAttendees() {
  const fetchedAttendees = await fetchy(`/api/events/${props.id}/attendees`, "GET");
  attendees.value = fetchedAttendees;
}

async function getEventTrail(trailId) {
  trail.value = await fetchy("/api/trails/", "GET", { query: { _id: trailId } });
}

onBeforeMount(async () => {
  await getEvent();
  if (event.value) {
    await getEventAttendees();
    registered.value = attendees.value
      .map((a) => {
        return a.username;
      })
      .includes(currentUsername.value);
  }

  loaded.value = true;
});

const registerEvent = async () => {
  try {
    await fetchy(`api/events/${event.value._id}/register`, "PATCH");
  } catch {
    return;
  }

  registered.value = true;
};

const unregisterEvent = async () => {
  try {
    await fetchy(`api/events/${event.value._id}/unregister`, "PATCH");
  } catch {
    return;
  }

  registered.value = false;
};

const deleteEvent = async () => {
  try {
    await fetchy(`api/events/${event.value._id}`, "DELETE");
  } catch {
    return;
  }

  event.value = undefined;
};
</script>

<template>
  <div id="event-view-container">
    <v-row v-if="event">
      <v-col md="7" class="details-section col">
        <div class="row title">
          <div class="date-tile">
            <h3>{{ abbreviateMonth(parseInt(event.date.month)) }}</h3>
            <h1>{{ event.date.date }}</h1>
          </div>
          <div>
            <h1>{{ event.name }}</h1>
            <h2>Hosted by {{ event.owner }}</h2>
            <h3>{{ formatTime(event.time.hour, event.time.minute, event.time.am) }}</h3>
            <div class="row">
              <button v-if="event.owner === currentUsername" @click="deleteEvent">Delete Event</button>
              <button v-else-if="registered" @click="unregisterEvent">Unregister</button>
              <button v-else @click="registerEvent">Register</button>
            </div>
          </div>
        </div>

        <article>
          <h3>Event Description</h3>
          <p>{{ event.description }}</p>
        </article>

        <article v-if="trail.length > 0">
          <h3>Event Trail</h3>

          <div>
            <p>Estimated distance: {{ trail[0].distance }} miles</p>
            <p>Estimated durations: {{ trail[0].duration }} hours</p>
          </div>

          <div class="map-container">
            <MapVisualizerComponent :draggable="false" :trails="trail" mapRef="event-details-map" />
          </div>
        </article>

        <article>
          <h3>Who's attending</h3>
          <div class="row">
            <AttendeeCard v-for="attendee in attendees" :key="attendee._id" :user="attendees">{{ attendee.username }}</AttendeeCard>
          </div>
        </article>

        <article>
          <h3>What you'll need</h3>
          <v-table class="checklist-table">
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th class="text-left">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in event.checklist" :key="item">
                <td>{{ item.item }}</td>
                <td>{{ item.qty }}</td>
              </tr>
            </tbody>
          </v-table>
        </article>

        <article>
          <h3 v-if="event.tags.difficulty.length > 0 || event.tags.terrain.length > 0 || event.tags.activity.length > 0 || event.tags.other.length > 0">Tags</h3>
          <div v-if="event.tags.difficulty.length > 0">
            <h5>Difficulty</h5>
            <div class="row">
              <Tag v-for="tag in event.tags.difficulty" :key="tag">{{ tag }} </Tag>
            </div>
          </div>
          <div v-if="event.tags.terrain.length > 0">
            <h5>Terrain</h5>
            <div class="row">
              <Tag v-for="tag in event.tags.terrain" :key="tag">{{ tag }} </Tag>
            </div>
          </div>
          <div v-if="event.tags.activity.length > 0">
            <h5>Activity</h5>
            <div class="row">
              <Tag v-for="tag in event.tags.activity" :key="tag">{{ tag }} </Tag>
            </div>
          </div>

          <div v-if="event.tags.other.length > 0">
            <h5>Misc.</h5>
            <div class="row">
              <Tag v-for="tag in event.tags.other" :key="tag">{{ tag }} </Tag>
            </div>
          </div>
        </article>
      </v-col>

      <v-col md="5">
        <div class="event-feed col">
          <h3 class="white">Discussions</h3>
          <EventFeedComponent v-if="registered" :postIds="event.posts" :eventId="event._id" />
          <div v-else center class="error">Register for the event to view posts!</div>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="!loaded" center class="error">
      <v-progress-circular indeterminate></v-progress-circular>
    </v-row>
    <v-row v-if="loaded && !event" center class="error">
      <h4>Could not find event!</h4>
    </v-row>
  </div>
</template>

<style scoped>
.date-tile {
  background-color: #ffffff97;
  display: flex;
  flex-direction: column;
  padding: 2em;
  width: fit-content;
  align-items: center;
}
.date-tile > * {
  margin: 0;
  padding: 0;
}
.checklist-table {
  background-color: rgba(255, 255, 255, 0.214);
  color: white;
}

.v-table .v-table__wrapper > table > thead > tr > th {
  color: white;
}

.event-feed {
  overflow-y: scroll;
}

.white {
  color: white;
  background-color: #ffffff00;
}

.error {
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: #ffffff62;
  border-radius: 1em;
  margin: auto;
  padding: 1em;
  width: 100%;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
}

#event-view-container {
  padding: 2em;
  background-color: #95b08d;
  height: 100%;
  flex: 1;
}

.details-section {
  color: white;
}

.row.title {
  gap: 2em;
}

.row {
  margin-top: 0.5em;
  display: flex;
  flex-direction: row;
  gap: 1em;
  flex-wrap: wrap;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 2em;
}

article {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.map-container {
  border-radius: 20px;
  height: 60vh;
  position: relative;
}

button {
  border: 1px solid white;
  background-color: rgb(0, 0, 0, 0);
  color: white;
  font-size: 14px;
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
</style>
