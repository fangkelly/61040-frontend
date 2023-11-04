<script setup lang="ts">
// @ts-nocheck
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
      return r.from;
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
    <div v-if="pendingRequests.length === 0">No requests.</div>

    <div v-for="pending in pendingRequests" :key="`pending-${pending}`" class="friend-row">
      {{ pending }}
      <div class="row">
        <v-icon @click="handleAcceptRequest(pending)">mdi-check</v-icon>

        <v-icon @click="handleRejectRequest(pending)">mdi-close</v-icon>
      </div>
    </div>
  </div>
  <div v-else class="center">
    <v-progress-circular indeterminate color="white"></v-progress-circular>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
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
