<script setup lang="ts">
import imageCompression from "browser-image-compression";
import { onMounted, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

let content = ref("");
let media = ref();
let mediaStream = ref();

const emit = defineEmits(["refreshPosts"]);

const rules = [
  (v) => {
    if (v) return true;
    return "Content cannot be empty for a post!";
  },
];

const createPost = async (content: string, media: string) => {
  try {
    const res = await fetchy("/api/posts", "POST", {
      body: { content, media },
    });

    const postId = res.post._id;
    emit("updatePost", postId);

    // add association of post to trail

    emptyForm();
  } catch (_) {
    return;
  }
};

const emptyForm = () => {
  content.value = "";
  media.value = "";
  mediaStream.value = [];
};

onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.3/dist/heic2any.min.js";
  script.async = true;
  //script.onload = () => this.scriptLoaded();
  document.body.appendChild(script);
});

const readFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageBuffer = e.target.result;
    media.value = imageBuffer;
  };
  try {
    reader.readAsDataURL(file);
  } catch (err) {
    throw new Error("Could not display image!");
  }
};

const handleUploadImage = (files) => {
  if (files.length < 1) {
    media.value = undefined;
  }
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      imageCompression(file, options).then((compressedFile) => {
        let ext = file.name.toLowerCase().split(".").pop();
        ext.toLowerCase();
        if (ext === "jpg") ext = "jpeg";
        if (ext === "heic" || ext === "heif") {
          console.log("heic detected");
          heic2any({
            blob: compressedFile,
            toType: "image/jpeg",
            quality: 0.5,
          }).then((img) => {
            readFile(img);
          });
        } else {
          readFile(compressedFile);
        }
      });
    }
  } catch (e) {
    console.log("could not process image");
  }
};
</script>

<template>
  <form @submit.prevent="createPost(content, media)" class="trail-post-form background">
    <img v-if="media" :src="media.toString('base64')" />
    <v-file-input
      v-model="mediaStream"
      @update:model-value="handleUploadImage(mediaStream)"
      variant="outlined"
      color="#95b08d"
      chips
      accept="image/*"
      label="Attach an image! (Optional)"
      hide-details
    ></v-file-input>

    <v-textarea v-model="content" class="trailPost-form" variant="outlined" color="#95b08d" required label="Create a post!" :rules="rules"></v-textarea>
    <div class="button-container"><button type="submit">Submit post</button></div>
  </form>
</template>

<style scoped>
.trail-post-form {
  display: flex;
  flex-direction: column;
  row-gap: 2em;
}

button {
  border: 1px solid #474747;
  color: #474747;
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
.button-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

.background {
  background-color: #95b08d24;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 1em;
  padding: 1em;
}
</style>
