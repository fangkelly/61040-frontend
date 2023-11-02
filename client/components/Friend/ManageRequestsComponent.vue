<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import { useFriendStore } from "../../stores/friend";
const friendStore = useFriendStore();
const { friends, requests } = storeToRefs(useFriendStore());
const { currentUsername } = storeToRefs(useUserStore());

const loaded = ref(false);

export interface requestType {
  from: string;
  to: string;
  status: string;
}

const pendingRequests = computed(() => {
  const pending = requests.value
    .filter((r: requestType) => r.status === "pending" && r.to === currentUsername.value)
    .map((r: requestType) => {
      r.from;
    });
  return pending;
});

onBeforeMount(async () => {
  await friendStore.updateRequests();
  loaded.value = true;
});
const handleAcceptRequest = async (pending) => {
  loaded.value = false;
  await friendStore.acceptFriendRequest(pending);
  await friendStore.updateRequests();
  loaded.value = true;
};

const handleRejectRequest = async (pending) => {
  loaded.value = false;
  await friendStore.rejectFriendRequest(pending);
  await friendStore.updateRequests();
  loaded.value = true;
};
</script>

<template>
  <div v-if="loaded" class="friend-table">
    <h3>Pending Requests</h3>
    <div v-for="pending in pendingRequests" :key="`pending-${pending}`" class="friend-row">
      {{ pending }}
      <div class="row">
        <v-icon @click="handleRejectRequest(pending)">mdi-close</v-icon>
        <v-icon @click="handleAcceptRequest(pending)">mdi-check</v-icon>
      </div>
    </div>
  </div>
  <v-progress-circular v-else indeterminate color="white"></v-progress-circular>
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
}

.friend-table {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
