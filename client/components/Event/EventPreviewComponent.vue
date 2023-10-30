<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { fetchy } from "../../utils/fetchy";
import { onBeforeMount, ref } from "vue";

const props = defineProps(["event"]);
const { currentUsername } = storeToRefs(useUserStore());

const loaded = ref(false);

let attendees = ref<Array>([]);
let registered = ref(false);

async function getAttendees() {
  let users;
  try {
    users = await fetchy(`api/events/${props.event._id}/attendees`, "GET");
  } catch (_) {
    return;
  }
  attendees.value = users;
}

const getAttendeesPreview = () => {
  if (attendees.value.length === 1) {
    return "is attending";
  } else if (attendees.value.length < 4) {
    return "are attending.";
  } else if (attendees.value.length >= 4) {
    return `and ${attendees.value.length - 3} others attending`;
  }
};

onBeforeMount(async () => {
  await getAttendees();
  loaded.value = true;
  registered.value = attendees.value
    .map((a) => {
      return a.username;
    })
    .includes(currentUsername.value);
});

const registerEvent = async () => {
  try {
    await fetchy(`api/events/${props.event._id}/register`, "PATCH");
  } catch {
    return;
  }

  registered.value = true;
};

const unregisterEvent = async () => {
  try {
    await fetchy(`api/events/${props.event._id}/unregister`, "PATCH");
  } catch {
    return;
  }

  registered.value = false;
};

const viewDetails = () => {
  // TODO: navigate to event info page;
};
</script>

<template>
  <div class="event-preview-container">
    <div class="event-preview-left">
      <p class="event-preview-month">{{ props.event.time }}</p>
      <p class="event-preview-date">{{ props.event.date }}</p>
    </div>
    <v-divider class="border-opacity-100" vertical></v-divider>
    <div class="event-preview-right">
      <p class="event-preview-name truncate">{{ props.event.name }}</p>
      <p class="event-preview-owner truncate">
        Hosted by <span class="underline">{{ props.event.owner }}</span>
      </p>
      <p class="event-preview-time">{{ props.event.time }}</p>
      <div class="row">
        <button v-if="registered" @click="unregisterEvent">Unregister</button>
        <button v-else @click="registerEvent">Register</button>
        <button @click="viewDetails">View Details</button>
      </div>
      <div class="row">
        <article v-for="attendee in attendees.slice(0, 3)" :key="attendee._id">
          <v-avatar color="surface-variant" size="x-small"></v-avatar>
        </article>
        <p class="event-preview-members">{{ getAttendeesPreview() }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
v-divider {
  width: 1px;
  background-color: white;
}

.event-preview-container {
  background-color: rgba(255, 255, 255, 0.5);
  width: 350px;
  height: 200px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: white;
  padding: 1em 0.5em;
}

.event-preview-container p {
  margin: 0 0 2.5px 0;
  padding: 0;
}

.event-preview-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40%;
  padding: 1em;
}

.event-preview-month {
  font-size: 18px;
}
.event-preview-date {
  font-size: 40px;
}

.event-preview-right {
  width: 50%;
  padding: 0.5em;
}

.event-preview-name {
  font-size: 24px;
}

.event-preview-owner {
  font-size: 16px;
}

.event-preview-members {
  font-size: 8px;
}

.event-preview-time {
  font-size: 12px;
}

.underline {
  text-decoration: underline;
}

.row {
  display: flex;
  flex-direction: row;
  column-gap: 0.5em;
  margin: 0.5em 0;
  align-items: center;
}

button {
  border: 1px solid white;
  background-color: rgb(0, 0, 0, 0);
  color: white;
  font-size: 10px;
  font-weight: 100;
  cursor: pointer;
  width: max-content;
  height: 25px;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.5em 0.5em;
}

button:hover {
  background-color: white;
  color: #95b08d;
  border: 1px solid #95b08d;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
