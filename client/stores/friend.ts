// @ts-nocheck
import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchy } from "../utils/fetchy";

export interface requestType {
  from: string;
  to: string;
  status: string;
}

export const useFriendStore = defineStore(
  "friend",
  () => {
    const friends = ref([]);
    const requests: requestType[] = ref([]);

    const updateFriends = async () => {
      const friendsList = await fetchy("/api/friends", "GET", { alert: false });
      friends.value = friendsList;
    };

    const updateRequests = async () => {
      const requestsList = await fetchy("/api/friend/requests", "GET", { alert: false });
      requests.value = requestsList;
    };

    const sendFriendRequest = async (to: string) => {
      await fetchy(`/api/friend/requests/${to}`, "POST", { alert: false });
      await updateRequests();
    };

    const removeFriendRequest = async (to: string) => {
      await fetchy(`/api/friend/requests/${to}`, "DELETE", { alert: false });
      await updateRequests();
    };

    const acceptFriendRequest = async (from: string) => {
      await fetchy(`/api/friend/accept/${from}`, "PUT", { alert: false });
      await updateRequests();
      await updateFriends();
    };

    const rejectFriendRequest = async (from: string) => {
      await fetchy(`/api/friend/reject/${from}`, "PUT", { alert: false });
      await updateRequests();
    };

    const removeFriend = async (friend: string) => {
      await fetchy(`/api/friends/${friend}`, "DELETE", { alert: false });
      await updateFriends();
    };

    return { friends, requests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, removeFriendRequest, updateFriends, updateRequests };
  },
  { persist: true },
);
