import { create } from "zustand";
import axiosClient from "../config/axiosClient";

const useChatStore = create((set) => ({
  conversations: [],
  isLoading: true,
  isEmptyChat: false,
  fetchConversations: async (userId) => {
    set({ isLoading: true, isEmptyChat: false });
    try {
      const response = await axiosClient.get(
        `/Conversations/${userId}/conversations`
      );
      if (response.data && response.data.success) {
        set({
          conversations: response.data.conversations || [],
          isEmptyChat: response.data.conversations.length === 0,
        });
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (error.response && error.response.status === 404) {
        set({ isEmptyChat: true, conversations: [] });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useChatStore;