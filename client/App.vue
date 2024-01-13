<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { useFriendStore } from "./stores/friend";
const { currentUsername } = storeToRefs(useUserStore());

const currentRoute = useRoute();
const currentRouteName = computed(() => currentRoute.name);
const userStore = useUserStore();
const friendStore = useFriendStore();
const { isLoggedIn } = storeToRefs(userStore);
const { toast } = storeToRefs(useToastStore());

// Make sure to update the session before mounting the app in case the user is already logged in
onBeforeMount(async () => {
  try {
    await userStore.updateSession();
    await friendStore.updateFriends();
    await friendStore.updateRequests();
  } catch {
    // User is not logged in
  }
});
</script>

<template>
  <div id="app-container">
    <header>
      <nav>
        <div class="title">
          <!-- <img src="@/assets/images/logo.svg" /> -->
          <RouterLink :to="{ name: 'Home' }">
            <h1>trailMix</h1>
          </RouterLink>
        </div>
        <ul>
          <li>
            <RouterLink :to="{ name: 'Home' }" :class="{ underline: currentRouteName == 'Home', link: true }"> Home </RouterLink>
          </li>

          <!-- TODO: Remove EVENT REOUTE WHEN DONE TESTING! -->

          <li v-if="isLoggedIn">
            <RouterLink :to="{ name: 'Profile', params: { user: currentUsername } }" :class="{ underline: currentRoute.fullPath === `/profile/${currentUsername}`, link: true }"> Profile </RouterLink>
          </li>
          <li v-if="isLoggedIn">
            <RouterLink :to="{ name: 'Settings' }" :class="{ underline: currentRouteName == 'Settings', link: true }"> Settings </RouterLink>
          </li>
          <li v-else>
            <RouterLink :to="{ name: 'Login' }" :class="{ underline: currentRouteName == 'Login', link: true }"> Login </RouterLink>
          </li>
        </ul>
      </nav>
      <article v-if="toast !== null" class="toast" id="override-toast" :class="toast.style">
        <p>{{ toast.message }}</p>
      </article>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
@import "./assets/toast.css";

nav {
  padding: 1em 2em;
  background-color: #95b08d;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid white;
  font-family: "IBM Plex Sans", sans-serif;
  font-family: "Lato", sans-serif;
  font-family: "Open Sans", sans-serif;
}

#app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* background-color: #95b08d; */
  font-family: "IBM Plex Sans", sans-serif;
  font-family: "Lato", sans-serif;
  font-family: "Open Sans", sans-serif;
}

h1 {
  font-size: 2em;
  margin: 0;
  color: white;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

img {
  height: 2em;
}

a {
  font-size: large;
  color: black;
  text-decoration: none;
}

ul {
  list-style-type: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 1em;
}

.underline {
  text-decoration: underline;
}

.link {
  color: white;
}

#override-toast {
  z-index: 9999;
}
</style>
