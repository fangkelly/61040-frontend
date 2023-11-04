<script setup lang="ts">
import EventComposerComponent from "@/components/Event/EventComposerComponent.vue";
import PostListComponent from "@/components/Post/PostListComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import MapInteractiveComponent from "../components/Map/MapInteractiveComponent.vue";
import { useFriendStore } from "../stores/friend";
import { fetchy } from "../utils/fetchy";
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const { friends } = storeToRefs(useFriendStore());
const mapView = ref(true);

/** get all trails */

let allTrails = ref<Array<Record<string, string>>>([]);

async function getAllTrails() {
  let universalTrails;
  try {
    universalTrails = await fetchy(`api/trails/`, "GET", { query: {} });
  } catch (_) {
    return;
  }
  allTrails.value = universalTrails;
}

const eventTrails = computed(() => {
  const filteredOutNonEvents = allTrails.value.filter((t) => t.event);
  return filteredOutNonEvents;
});

const usersTrails = computed(() => {
  const filteredOutEvents = allTrails.value.filter((t) => !t.event);
  return filteredOutEvents;
});

const loaded = ref(false);

onBeforeMount(async () => {
  await getAllTrails();
  loaded.value = true;
});
</script>

<template>
  <main>
    <section id="home-nav" class="row home-buttons">
      <section class="create-content row">
        <EventComposerComponent @refreshTrails="getAllTrails" :trails="eventTrails" />
      </section>
      <section class="view-toggle row">
        <v-icon color="white">mdi-view-grid</v-icon>
        <v-switch v-model="mapView" hide-details inset> </v-switch>
        <v-icon color="white">mdi-map</v-icon>
      </section>
    </section>

    <div v-if="mapView" class="map-container"><MapInteractiveComponent :trails="usersTrails" @refreshTrails="getAllTrails" mapRef="home-map-container" /></div>
    <div v-else class="feed-container"><PostListComponent /></div>
  </main>
</template>

<style scoped>
.map-container {
  position: relative;
  height: 90vh;
}

.feed-container {
  flex: 1;
  background-color: #95b08d;
}

h1 {
  text-align: center;
}

#home-nav {
  background-color: #95b08da3;
}

.create-content {
  column-gap: 1em;
}

.create-content,
.view-toggle {
  padding: 0.5em 2em;
}

.view-toggle {
  column-gap: 0.5em;
}

.view-toggle * {
  min-width: fit-content;
  flex: 0;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.home-buttons {
  justify-content: space-between;
}

main {
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
