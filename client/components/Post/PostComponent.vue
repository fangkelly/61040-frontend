<script setup lang="ts">
import CommentListComponent from "@/components/Comment/CommentListComponent.vue";
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";

const props = defineProps(["post"]);
const emit = defineEmits(["editPost", "refreshPosts", "handleDeletePost"]);
const { currentUsername } = storeToRefs(useUserStore());
</script>

<template>
  <div class="post-container">
    <div class="background">
      <p class="author">{{ props.post.author }}</p>
      <img v-if="post.media" :src="post.media.toString('base64')" />

      <p>{{ props.post.content }}</p>
      <div class="base">
        <menu v-if="props.post.author == currentUsername">
          <li>
            <button class="button-error btn-small" @click="emit(`handleDeletePost`, props.post._id)"><v-icon>mdi-close</v-icon></button>
          </li>
        </menu>
        <article class="timestamp">
          <p v-if="props.post.dateCreated !== props.post.dateUpdated">Edited on: {{ formatDate(props.post.dateUpdated) }}</p>
          <p v-else>Created on: {{ formatDate(props.post.dateCreated) }}</p>
        </article>
      </div>
    </div>
    <v-divider class="divider"></v-divider>
    <CommentListComponent :target="props.post._id" />
  </div>
</template>

<style scoped>
.post-container {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.divider {
  padding: 0 1em;
}
.background {
  background-color: #95b08d65;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

img {
  width: 100%;
}

p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
  justify-content: end;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}
</style>
