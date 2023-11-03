<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { ref } from "vue";

let username = ref("");
let password = ref("");

const { updateUser, updateSession } = useUserStore();

async function updateUsername() {
  await updateUser({ username: username.value });
  await updateSession();
  username.value = "";
}

async function updatePassword() {
  await updateUser({ password: password.value });
  await updateSession();
  password.value = "";
}
</script>

<template>
  <div class="update-user-form-container">
    <h2>Update user details</h2>
    <form @submit.prevent="updateUsername" class="pure-form">
      <fieldset>
        <legend>Change your username</legend>
        <input type="text" placeholder="New username" v-model="username" required />
        <button type="submit">Update username</button>
      </fieldset>
    </form>

    <form @submit.prevent="updatePassword" class="pure-form">
      <fieldset>
        <legend>Change your password</legend>
        <input type="password" placeholder="New password" v-model="password" required />
        <button type="submit">Update password</button>
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
legend {
  color: white;
}
input {
  margin-right: 1em;
  color: white;
}
.update-user-form-container {
  background-color: rgba(255, 255, 255, 0.212);
  color: white;
  padding: 2em;
  border-radius: 20px;
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
