<script setup lang="ts">
import LoginForm from "@/components/Login/LoginForm.vue";
import RegisterForm from "@/components/Login/RegisterForm.vue";
</script>

<template>
  <main>
    <h1>Please login or register!</h1>
    <LoginForm />
    <RegisterForm />
  </main>
</template>

<style scoped>
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
