<script setup lang="ts">
import CommentComponent from "@/components/Comment/CommentComponent.vue";
import CreateCommentForm from "@/components/Comment/CreateCommentForm.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";

const { isLoggedIn } = storeToRefs(useUserStore());

const loaded = ref(false);
let comments = ref<Array<Record<string, string>>>([]);

const props = defineProps(["target"]);

async function getComments() {
  let query: Record<string, string> = props.target !== undefined ? { target: props.target } : {};
  let commentResults;
  try {
    commentResults = await fetchy("/api/comments", "GET", { query });
  } catch (_) {
    return;
  }
  comments.value = commentResults;
}

onBeforeMount(async () => {
  await getComments();
  loaded.value = true;
});
</script>

<template>
  <section v-if="isLoggedIn">
    <CreateCommentForm @getComments="getComments" @refreshComments="getComments" :target="props.target" />
  </section>

  <section class="comments" v-if="loaded">
    <article v-for="comment in comments" :key="comment._id">
      <CommentComponent :comment="comment" @refreshComments="getComments" />
    </article>
  </section>
  <p v-else>Loading...</p>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

section,
p,
.row {
  max-width: 60em;
}

.center {
  align-items: center;
  justify-content: center;
}

article {
  background-color: #95b08d24;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}
</style>
