<script setup lang="ts">
console.log("hoorsu");
import { useToastStore } from "@/stores/toast";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

const currentRoute = useRoute();
const currentRouteName = computed(() => currentRoute.name);
const userStore = useUserStore();
const { isLoggedIn } = storeToRefs(userStore);
const { toast } = storeToRefs(useToastStore());

// Make sure to update the session before mounting the app in case the user is already logged in
onBeforeMount(async () => {
  console.log("mouting");
  try {
    await userStore.updateSession();
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
          <li v-if="isLoggedIn">
            <RouterLink :to="{ name: 'Profile' }" :class="{ underline: currentRouteName == 'Profile', link: true }"> Profile </RouterLink>
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
}

#app-container {
  /* background-color: #95b08d; */
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
