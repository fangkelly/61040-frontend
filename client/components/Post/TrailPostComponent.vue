<script setup lang="ts">
import CreateTrailPostForm from "@/components/Post/CreateTrailPostForm.vue";
import PostComponent from "@/components/Post/PostComponent.vue";
import { onBeforeMount, onUpdated, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const emit = defineEmits(["updatePostValue"]);
const props = defineProps(["selectedTrail", "postIndex"]);

let post = ref();

async function getPost(postId) {
  console.log("in getPost ", postId);
  if (postId) {
    console.log("in in postId ", postId);
    const postResponse = await fetchy(`/api/posts/`, "GET", { query: { id: postId } });
    post.value = postResponse.post;
    console.log("call getPost ", getPost);
  } else {
    post.value = undefined;
  }
}

async function syncPostWithTrail(id) {
  const newLocations = props.selectedTrail.locations;
  const newPost = { ...newLocations[props.postIndex], post: id };
  newLocations[props.postIndex] = newPost;
  console.log("NEW LOCATIONS ", newLocations);
  const postResponse = await fetchy(`/api/trails/${props.selectedTrail._id}`, "PATCH", { body: { locations: newLocations } });
}

onBeforeMount(async () => {
  const postId = props.selectedTrail.locations[props.postIndex].post;
  await getPost(postId);
});

onUpdated(async () => {
  console.log(`in inupdated with selectedTrail postIndex ${props.postIndex} `, props.selectedTrail);
  await getPost(props.selectedTrail.locations[props.postIndex].post);
});

function closeForm() {
  emit("updatePostValue", -1);
}
</script>

<template>
  <v-sheet rounded class="post-sheet">
    <div class="row">
      <h3>{{ selectedTrail.name }}</h3>
      <v-icon @click="closeForm">mdi-close</v-icon>
    </div>

    <!-- TODO: clicking on author takes them to their profile -->
    <h4>{{ selectedTrail.author }}</h4>
    <h6>{{ selectedTrail.distance }} miles</h6>
    <h6>{{ selectedTrail.duration }} hours</h6>
    <h6>{{ `(${selectedTrail.locations[postIndex].lng}, ${selectedTrail.locations[postIndex].lat})` }}</h6>

    <v-divider class="divider"></v-divider>

    <div v-if="!post">
      <p>You have not made a post for this location yet!</p>
      <CreateTrailPostForm
        @updatePost="
          async (id) => {
            await syncPostWithTrail(id);
            getPost(id);
          }
        "
      />
    </div>

    <div v-else>
      <PostComponent :post="post" />
    </div>
  </v-sheet>
</template>

<style scoped>
.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.post-sheet {
  position: absolute;
  top: 2em;
  right: 2em;
  padding: 1em;
  width: 40%;
  height: calc(100% - 4em);
  overflow-y: scroll;
}

.divider {
  margin: 1em 0;
}
</style>
