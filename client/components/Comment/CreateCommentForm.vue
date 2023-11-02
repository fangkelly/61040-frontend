<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["target"]);
const content = ref("");
const emit = defineEmits(["refreshComments"]);

const createComment = async (content: string, target: string) => {
  try {
    await fetchy("/api/comments", "POST", {
      body: { content, target },
    });
  } catch (_) {
    return;
  }
  emit("refreshComments");
  emptyForm();
};

const emptyForm = () => {
  content.value = "";
};
</script>

<template>
  <form @submit.prevent="createComment(content, props.target)">
    <v-textarea id="content" color="#95b08d" variant="outlined" v-model="content" placeholder="Create a comment!" required hide-details rows="1"> </v-textarea>
    <div class="right-align"><button type="submit">Create Comment</button></div>
  </form>
</template>

<style scoped>
.right-align {
  display: flex;
  flex-direction: row;
  justify-content: end;
}

form {
  background-color: #95b08d24;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
  width: 100%;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}

button {
  border: 1px solid #6d6d6d;
  color: #6d6d6d;
  font-size: 12px;
  font-weight: 100;
  cursor: pointer;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 0.25em;
}

button:hover {
  background-color: #95b08d;
  color: white;
  border: 1px solid white;
}
</style>
