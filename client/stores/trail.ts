import { fetchy } from "@/utils/fetchy";
import { defineStore } from "pinia";
import { ref } from "vue";

/** TODO: figure out pinia */
export const useUserStore = defineStore(
  "trail",
  () => {
    const allTrailsUniversal = ref([]);
    const allTrailsUser = ref([]);

    const getAllTrailsUniversal = async () => {
      await fetchy(`api/trails/`, "GET", { query: {} });
    };

    const getAllTrailsUser = async (author: string) => {
      await fetchy(`api/trails/`, "GET", { query: { author } });
    };

    const resetStore = () => {
      allTrailsUser.value = [];
      allTrailsUniversal.value = [];
    };

    return {
      allTrailsUniversal,
      allTrailsUser,
      getAllTrailsUniversal,
      getAllTrailsUser,
      resetStore,
    };
  },
  { persist: true },
);
