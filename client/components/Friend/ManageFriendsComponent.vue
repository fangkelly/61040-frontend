<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import { useFriendStore } from "../../stores/friend";
const friendStore = useFriendStore();
const { friends, requests } = storeToRefs(useFriendStore());

const loaded = ref(false);

onBeforeMount(async () => {
  await friendStore.updateFriends();
  loaded.value = true;
});

async function handleRemoveFriend(friend: string) {
  loaded.value = false;
  await friendStore.removeFriend(friend);
  await friendStore.updateFriends();
  loaded.value = true;
}
</script>

<template>
  <div class="friend-table" v-if="loaded">
    <h3>Friends</h3>
    <div v-for="friend in friends" :key="`friend=${friend}`" class="friend-row">
      <p>{{ friend }}</p>
      <v-icon @click="handleRemoveFriend(friend)">mdi-close</v-icon>
    </div>
  </div>
  <v-progress-circular v-else indeterminate color="white"></v-progress-circular>
</template>

<style scoped>
.friend-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.friend-table {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
