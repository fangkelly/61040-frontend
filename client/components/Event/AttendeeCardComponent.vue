<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps(["user"]);
</script>

<template>
  <div class="attendee-card">
    <v-avatar v-if="props.user.avatar">
      <v-img :src="props.user.avatar"></v-img>
    </v-avatar>
    <v-icon v-else>mdi-account</v-icon>

    <slot></slot>
    <!-- slot outlet -->
  </div>
</template>

<style scoped>
.attendee-card {
  display: flex;
  gap: 1em;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.376);
  color: white;
  font-size: 14px;
  padding: 1em;
  /* border: 1px solid white; */
  border-radius: 10px;
  width: fit-content;
}
</style>
