import { create } from "zustand";
import axiosClient from "../config/axiosClient";

const useCheckOrderStore = create((set) => ({
  orderInstore: [],
  isLoadingOrderInstore: false,
  orderInstoreError: null,
  fetchOrderInstore: async () => {
    try {
      set({ isLoadingOrderInstore: true, orderInstoreError: null });
      const response = await axiosClient.get("/staff/orders/pickedup");
      set({ orderInstore: response.data, isLoadingOrderInstore: false });
      return data;
    } catch (error) {
      set({ orderInstoreError: error.message, isLoadingOrderInstore: false });
    }
  },

  orderChecking: [],
  isLoadingOrderChecking: false,
  orderCheckingError: null,
  fetchOrderChecking: async () => {
    try {
      set({ isLoadingOrderChecking: true, orderCheckingError: null });
      const response = await axiosClient.get(`/staff/orders/checking`);
      set({ orderChecking: response.data, isLoadingOrderChecking: false });
    } catch (error) {
      set({ orderCheckingError: error.message, isLoadingOrderChecking: false });
    }
  },

  isLoadingReciveToChecking: false,
  reciveToCheckingError: null,
  reciveToChecking: async (orderId) => {
    try {
      set({ isLoadingReciveToChecking: true, reciveToCheckingError: null });
      const response = await axiosClient.post(
        `/staff/orders/receive-for-check?orderId=${orderId}`
      );
      set({ isLoadingReciveToChecking: false });
      return response.data;
    } catch (error) {
      console.error("Error starting pick up:", error);
      set({
        reciveToCheckingError: error.message,
        isLoadingReciveToChecking: false,
      });
    }
  },

  isUpdatingOrder: false,
  updateOrderError: null,
  updateOrder: async (formData) => {
    try {
      set({ isUpdatingOrder: true, updateOrderError: null });
      const response = await axiosClient.post(
        `/staff/upload-order-photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ isUpdatingOrder: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ updateOrderError: error.message, isUpdatingOrder: false });
    }
  },
}));

export default useCheckOrderStore;
