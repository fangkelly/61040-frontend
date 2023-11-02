<script setup lang="ts">
import { defineProps, onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import CreatePostForm from "../Post/CreatePostForm.vue";
import PostComponent from "../Post/PostComponent.vue";
const props = defineProps(["postIds", "eventId"]);

const loaded = ref(false);
const posts = ref([]);

async function getPosts() {
  const postPromises = props.postIds.map(async (postId) => {
    return await fetchy("/api/posts/", "GET", { query: { id: postId } });
  });

  const fetchedPosts = await Promise.all(postPromises);
  console.log("fetchedPosts ", fetchedPosts);
  posts.value = fetchedPosts.map((p) => {
    return p.post;
  });
}

onBeforeMount(async () => {
  await getPosts();
  loaded.value = true;
});

async function handleCreatePost(content: string, media?: string) {
  console.log("CONTENT AND MEDIA IN HANDLE CREATE PSOT ", content, media);
  const res = await fetchy(`/api/events/${props.eventId}/post`, "PATCH", { body: { content, media } });

  console.log(res);
  // TODO; state management
  const postCopy = [...posts.value];
  postCopy.unshift(res);
  posts.value = postCopy;
}

async function handleDeletePost(postId: string) {
  console.log("postId to delete ", postId);
  const res = await fetchy(`/api/events/${props.eventId}/delete_post/${postId}`, "PATCH");
  console.log(res);

  // TODO: state management
  posts.value = posts.value.filter((p) => {
    p._id !== postId;
  });
}
</script>

<template>
  <div>
    <div class="background form-container">
      <CreatePostForm @handleCreatePost="handleCreatePost" />
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
