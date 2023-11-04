<script setup lang="ts">
// @ts-nocheck
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import EventPreviewComponent from "../Event/EventPreviewComponent.vue";
import CreatePostForm from "./CreatePostForm.vue";
import PostComponent from "./PostComponent.vue";

const { isLoggedIn } = storeToRefs(useUserStore());

const loaded = ref(false);
let posts = ref([]);
let events = ref([]);

async function getEvents() {
  let eventsList;
  try {
    const eventResults = await fetchy("/api/events", "GET", {});
    eventsList = eventResults;
  } catch (_) {
    return;
  }
  events.value = eventsList;
}

async function getPosts() {
  console.log("in get posts");
  let postsList;
  try {
    const postResults = await fetchy("/api/posts", "GET", {});
    postsList = postResults.post;
    console.log("postsList ", postsList);
  } catch (_) {
    return;
  }
  const filterEventPosts = postsList.filter((p) => !p.event);
  console.log("filterEventPosts ", filterEventPosts);
  posts.value = filterEventPosts;
  console.log("posts.value ", posts.value);
}

async function handleCreatePost(content: string, media?: string) {
  const res = await fetchy(`/api/posts`, "POST", { body: { content, media, event: undefined } });
  await getPosts();
}

async function handleDeletePost(postId: string) {
  try {
    await fetchy(`/api/posts/${postId}`, "DELETE");
  } catch {
    return;
  }

  await getPosts();
}

onBeforeMount(async () => {
  await getPosts();
  await getEvents();
  console.log("POSTS HERe ", posts);
  loaded.value = true;
});
</script>

<template>
  <div class="feed-container">
    <div class="row">
      <div class="col">
        <h3>All Events</h3>
        <EventPreviewComponent v-for="event in events" :event="event" :key="event._id" />
      </div>
      <div class="col discussions">
        <h3>Discussions</h3>
        <div class="col">
          <div v-if="isLoggedIn" class="background"><CreatePostForm @handle-create-post="handleCreatePost" /></div>
          <div v-else class="background">Log in to create a post!</div>
          <!-- <div><PostComponent v-for="post in posts" :key="post._id" @handle-delete-post="handleDeletePost" /></div -->
          <div class="posts-list-container col"><PostComponent class="background" @handleDeletePost="handleDeletePost" v-for="post in posts" :post="post" :key="post._id" /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discussions {
  width: 100%;
  min-width: 0;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
.row {
  display: flex;
  flex-direction: row;
  gap: 2em;
}
.feed-container {
  padding: 2em;
}

h3 {
  color: white;
  margin-bottom: 1em;
}

.posts-list-container {
  overflow-y: scroll;
}

.background {
  width: 100%;
  background-color: #ffffffe4;
  padding: 1em;
  border-radius: 20px;
}
</style>
