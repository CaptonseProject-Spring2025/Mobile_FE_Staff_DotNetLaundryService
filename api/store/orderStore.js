import { create } from "zustand";
import axiosClient from "../config/axiosClient";

const useOrderStore = create((set) => ({
  assignmentList: [],
  isLoadingOrderList: false,
  orderListError: null,
  fetchAssignmentList: async () => {
    try {
      set({ isLoadingOrderList: true, orderListError: null });
      const response = await axiosClient.get("/driver/my-assignments");
      set({ assignmentList: response.data, isLoadingOrderList: false });
      return data;
    } catch (error) {
      set({ orderListError: error.message, isLoadingOrderList: false });
    }
  },

  orderDetail: [],
  isLoadingOrderDetail: false,
  orderDetailError: null,
  fetchOrderDetail: async (orderId) => {
    try {
      set({ isLoadingOrderDetail: true, orderDetailError: null });
      const response = await axiosClient.get(`/orders/${orderId}`);
      set({ orderDetail: response.data, isLoadingOrderDetail: false });
    } catch (error) {
      set({ orderDetailError: error.message, isLoadingOrderDetail: false });
    }
  },

  isLoadingPickUp: false,
  pickUpError: null,
  startPickUp: async (orderId) => {
    try {
      set({ isLoadingPickUp: true, pickUpError: null });
      const response = await axiosClient.post(
        `/driver/start-pickup?orderId=${orderId}`
      );
      set({ isLoadingPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error starting pick up:", error);
      set({ pickUpError: error.message, isLoadingPickUp: false });
    }
  },

  isLoadingConfirmPickUp: false,
  confirmPickUpError: null,
  confirmPickUp: async (orderId, note) => {
    try {
      set({ isLoadingConfirmPickUp: true, confirmPickUpError: null });
      const response = await axiosClient.post(
        `/driver/confirm-pickup?orderId=${orderId}&notes=${note}`
      );
      set({ isLoadingConfirmPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ confirmPickUpError: error.message, isLoadingConfirmPickUp: false });
    }
  },

  isLoadingRevicedPickUp: false,
  revicedPickUpError: null,
  revicedPickUp: async (orderId) => {
    try {
      set({ isLoadingRevicedPickUp: true, revicedPickUpError: null });
      const response = await axiosClient.post(
        `/driver/confirm-received?orderId=${orderId}`
      );
      set({ isLoadingRevicedPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ revicedPickUpError: error.message, isLoadingRevicedPickUp: false });
    }
  },

  isLoadingCancelPickUp: false,
  cancelPickUpError: null,
  cancelPickUp: async (orderId, reason) => {
    try {
      set({ isLoadingCancelPickUp: true, cancelPickUpError: null });
      const response = await axiosClient.post(
        `/driver/cancel-pickup?orderId=${orderId}&reason=${reason}`
      );
      set({ isLoadingCancelPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ cancelPickUpError: error.message, isLoadingCancelPickUp: false });
    }
  },

  isLoadingStartDelivery: false,
  startDeliveryError: null,
  startDelivery: async (orderId) => {
    try {
      set({ isLoadingStartDelivery: true, startDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/start-delivery?orderId=${orderId}`
      );
      set({ isLoadingStartDelivery: false });
      return response.data;
    } catch (error) {
      console.error("Error starting delivery:", error);
      set({ startDeliveryError: error.message, isLoadingStartDelivery: false });
    }
  },

  isLoadingConfirmDelivery: false,
  confirmDeliveryError: null,
  confirmDelivery: async (orderId, note) => {
    try {
      set({ isLoadingConfirmDelivery: true, confirmDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/confirm-delivered?orderId=${orderId}&notes=${note}`
      );
      set({ isLoadingConfirmDelivery: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming delivery:", error);
      set({
        confirmDeliveryError: error.message,
        isLoadingConfirmDelivery: false,
      });
    }
  },

  isLoadingCancelDelivery: false,
  cancelDeliveryError: null,
  cancelDelivery: async (orderId, reason) => {
    try {
      set({ isLoadingCancelDelivery: true, cancelDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/cancel-delivery?orderId=${orderId}&reason=${reason}`
      );
      set({ isLoadingCancelDelivery: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming delivery:", error);
      set({
        cancelDeliveryError: error.message,
        isLoadingCancelDelivery: false,
      });
    }
  },

  isLoadingFinishDelivery: false,
  finishDeliveryError: null,
  finishDelivery: async () => {
    try {
      set({ isLoadingFinishDelivery: true, finishDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/confirm-finish-delivery`
      );
      set({ isLoadingFinishDelivery: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming delivery:", error);
      set({
        finishDeliveryError: error.message,
        isLoadingFinishDelivery: false,
      });
    }
  },

  pickUpAdress: {},
  isLoadingPickUpAddress: false,
  pickUpAddressError: null,
  fetchPickUpAddress: async (assignmentId) => {
    try {
      set({ isLoadingPickUpAddress: true, pickUpAddressError: null });
      const response = await axiosClient.get(
        `/driver/pickup-address?assignmentId=${assignmentId}`
      );
      set({ pickUpAdress: response.data, isLoadingPickUpAddress: false });
    } catch (error) {
      console.error("Error fetching pick up address:", error);
      set({ pickUpAddressError: error.message, isLoadingPickUpAddress: false });
    }
  },

  deliveryAddress: {},
  isLoadingDeliveryAddress: false,
  deliveryAddressError: null,
  fetchDeliveryAddress: async (assignmentId) => {
    try {
      set({ isLoadingDeliveryAddress: true, deliveryAddressError: null });
      const response = await axiosClient.get(
        `/driver/delivery-address?assignmentId=${assignmentId}`
      );
      set({ deliveryAddress: response.data, isLoadingDeliveryAddress: false });
    } catch (error) {
      console.error("Error fetching delivery address:", error);
      set({
        deliveryAddressError: error.message,
        isLoadingDeliveryAddress: false,
      });
    }
  },
}));
export default useOrderStore;
