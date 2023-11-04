<script setup lang="ts">
// @ts-nocheck
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
    <div v-if="friends.length === 0">No friends.</div>
    <div v-for="friend in friends" :key="`friend=${friend}`" class="friend-row">
      <div class="row">
        <v-icon>mdi-account</v-icon>
        <p>{{ friend }}</p>
      </div>
      <v-icon @click="handleRemoveFriend(friend)">mdi-close</v-icon>
    </div>
  </div>
  <div v-else class="center">
    <v-progress-circular indeterminate color="white"></v-progress-circular>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-direction: row;
  gap: 1em;
}
.friend-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 80%;
}

.friend-table {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
