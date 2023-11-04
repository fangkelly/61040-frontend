<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { defineProps, onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import CreatePostForm from "../Post/CreatePostForm.vue";
import PostComponent from "../Post/PostComponent.vue";
const { isLoggedIn } = storeToRefs(useUserStore());
const props = defineProps(["postIds", "eventId"]);

const loaded = ref(false);
const posts = ref([]);

async function getPosts() {
  const postPromises = props.postIds.map(async (postId) => {
    return await fetchy("/api/posts/", "GET", { query: { id: postId } });
  });

  const fetchedPosts = await Promise.all(postPromises);
  posts.value = fetchedPosts.map((p) => {
    return p.post;
  });
}

onBeforeMount(async () => {
  await getPosts();

  loaded.value = true;
  console.log("POSTS ", posts);
});

async function handleCreatePost(content: string, media?: string) {
  const res = await fetchy(`/api/events/${props.eventId}/post`, "PATCH", { body: { content, media, event: props.eventId } });

  const postCopy = [...posts.value];
  postCopy.unshift(res);
  posts.value = postCopy;
}

async function handleDeletePost(postId: string) {
  const res = await fetchy(`/api/events/${props.eventId}/delete_post/${postId}`, "PATCH");

  // TODO: state management
  const filteredPosts = posts.value.filter((p) => p._id !== postId);
  posts.value = filteredPosts;
}
</script>

<template>
  <div>
    <div class="background form-container">
      <CreatePostForm @handleCreatePost="handleCreatePost" v-if="isLoggedIn" />
    </div>

    <div v-if="loaded && posts.length > 0" class="event-post-list">
      <PostComponent v-for="post in posts" :key="post._id" :post="post" class="background" @handleDeletePost="handleDeletePost" />
    </div>

    <div v-if="!loaded" class="center"><v-progress-circular indeterminate color="white"></v-progress-circular></div>
    <div v-if="loaded && posts.length === 0" class="empty-state background">No posts here yet.</div>
  </div>
</template>

<style scoped>
.center {
  padding: 2rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}
.form-container {
  border-radius: 20px;
}
.event-post-list {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
.background {
  width: 100%;
  background-color: #ffffffe4;
  padding: 1em;
  margin-top: 1em;
}

.empty-state {
  color: #474747;
}
</style>
