<script setup lang="ts">
import ManageFriendsComponent from "@/components/Friend/ManageFriendsComponent.vue";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import ManageRequestsComponentVue from "../components/Friend/ManageRequestsComponent.vue";
import UpdateUserForm from "../components/Setting/UpdateUserForm.vue";

const { currentUsername } = storeToRefs(useUserStore());
const { logoutUser, deleteUser } = useUserStore();

async function logout() {
  await logoutUser();
  void router.push({ name: "Home" });
}

async function delete_() {
  await deleteUser();
  void router.push({ name: "Home" });
}
</script>

<template>
  <main class="settings-container">
    <h1>Settings for {{ currentUsername }}</h1>
    <div class="row">
      <button class="pure-button pure-button-primary" @click="logout">Logout</button>
      <button class="button-error pure-button" @click="delete_">Delete User</button>
    </div>
    <UpdateUserForm />
    <div class="manage-friends-container">
      <h2>Manage friends</h2>

      <v-row>
        <v-col>
          <ManageFriendsComponent />
        </v-col>

        <v-col> <ManageRequestsComponentVue /> </v-col>
      </v-row>
    </div>
  </main>
</template>

<style scoped>
h1 {
  margin: 0;
}
.settings-container {
  gap: 2em;
  display: flex;
  flex-direction: column;
}

.manage-friends-container {
  background-color: rgba(255, 255, 255, 0.212);
  color: white;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 2em;
  border-radius: 20px;
}

main {
  padding: 2em;
  background-color: #95b08d;
  color: white;
  height: 100%;
  flex: 1;
}

.row {
  display: flex;
  flex-direction: row;
  column-gap: 1em;
}

button {
  border: 1px solid white;
  background-color: rgb(0, 0, 0, 0);
  color: white;
  font-size: 12px;
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
