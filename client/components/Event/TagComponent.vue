<script setup lang="ts"></script>

<template>
  <div class="tag">
    <slot></slot>
    <!-- slot outlet -->
  </div>
</template>

<style scoped>
.tag {
  border: 1px solid white;
  background-color: rgb(0, 0, 0, 0);
  color: white;
  font-size: 14px;
  font-weight: 100;
  width: max-content;
  /* border-radius: 30px; */
  transition: all 0.25s ease-in;
  padding: 0.5em 1em;
}
</style>
