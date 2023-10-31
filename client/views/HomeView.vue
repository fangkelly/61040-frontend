<script setup lang="ts">
import EventComposerComponent from "@/components/Event/EventComposerComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../utils/fetchy";
const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const mapView = ref(true);

/** get all trails */

let allTrails = ref<Array<Record<string, string>>>([]);

async function getAllTrails() {
  let usersTrails;
  try {
    usersTrails = await fetchy(`api/trails/`, "GET", { query: { author: currentUsername.value } });
  } catch (_) {
    return;
  }
  allTrails.value = usersTrails;
}

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
        <v-icon color="white">mdi-post</v-icon>
        <EventComposerComponent :trails="allTrails" />
      </section>
      <section class="view-toggle row">
        <v-icon color="white">mdi-view-grid</v-icon>
        <v-switch v-model="mapView" hide-details inset> </v-switch>
        <v-icon color="white">mdi-map</v-icon>
      </section>
    </section>

    <section>
      <!-- <div v-if="mapView"><MapVisualizerComponent mapRef="home-map-container" /></div> -->
      <!-- <div v-else><PostListComponent /></div> -->
    </section>
  </main>
</template>

<style scoped>
#home-map-container {
  position: relative;
  height: 100vh;
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
</style>
