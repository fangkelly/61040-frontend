<script setup lang="ts">
import PostComponent from "@/components/Post/PostComponent.vue";

const emit = defineEmits(["updateSelectedPostId"]);
const props = defineProps(["post"]);

// async function syncPostWithTrail(id) {
//   const newLocations = props.selectedTrail.locations;
//   const newPost = { ...newLocations[props.postIndex], post: id };
//   newLocations[props.postIndex] = newPost;
//   console.log("NEW LOCATIONS ", newLocations);
//   const postResponse = await fetchy(`/api/trails/${props.selectedTrail._id}`, "PATCH", { body: { locations: newLocations } });
// }

// onBeforeMount(async () => {
//   const postId = props.selectedTrail.locations[props.postIndex].post;
//   await getPost(postId);
// });

// onUpdated(async () => {
//   console.log(`in inupdated with selectedTrail postIndex ${props.postIndex} `, props.selectedTrail);
//   await getPost(props.selectedTrail.locations[props.postIndex].post);
// });

function closeForm() {
  emit("updateSelectedPostId", undefined);
}
</script>

<template>
  <v-sheet rounded class="post-sheet">
    <v-divider class="divider"></v-divider>

    <div v-if="!post">
      <p>You have not made a post for this location yet!</p>
      <!-- <CreateTrailPostForm
        @updatePost="
          async (id) => {
            await syncPostWithTrail(id);
            getPost(id);
          }
        "
      /> -->
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
