import { create } from "zustand";
import axiosClient from "../config/axiosClient";
import { Platform } from "react-native";

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

  assignmentDetail: [],
  isLoadingAssignmentDetail: false,
  assignmentDetailError: null,
  fetchAssignmentDetail: async (assignmentId) => {
    try {
      set({ isLoadingAssignmentDetail: true, assignmentDetailError: null });
      const response = await axiosClient.get(
        `/driver/assignments/${assignmentId}`
      );
      set({
        assignmentDetail: response.data,
        isLoadingAssignmentDetail: false,
      });
    } catch (error) {
      set({
        assignmentDetailError: error.message,
        isLoadingAssignmentDetail: false,
      });
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
      return response;
    } catch (error) {
      console.error("Error starting pick up:", error);
      set({ pickUpError: error.message, isLoadingPickUp: false });
      throw error;
    }
  },

  isLoadingConfirmPickUp: false,
  confirmPickUpError: null,
  confirmPickUp: async (formData) => {
    try {
      set({ isLoadingConfirmPickUp: true, confirmPickUpError: null });
      const response = await axiosClient.post(
        `/driver/confirm-picked-up`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ isLoadingConfirmPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ confirmPickUpError: error.message, isLoadingConfirmPickUp: false });
      throw error;
    }
  },

  isLoadingRevicedPickUp: false,
  revicedPickUpError: null,
  revicedPickUp: async (orderId) => {
    try {
      set({ isLoadingRevicedPickUp: true, revicedPickUpError: null });
      const response = await axiosClient.post(
        `/driver/confirm-pickup-success?orderId=${orderId}`
      );
      set({ isLoadingRevicedPickUp: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({ revicedPickUpError: error.message, isLoadingRevicedPickUp: false });
      throw error;
    }
  },

  isLoadingCancelPickUp: false,
  cancelPickUpError: null,
  cancelPickUp: async (formData) => {
    try {
      set({ isLoadingCancelPickUp: true, cancelPickUpError: null });
      const response = await axiosClient.post(
        `/driver/cancel-pickup`,
        formData
      );
      set({ isLoadingCancelPickUp: false });
      return response;
    } catch (error) {
      // Store the most descriptive error message
      const errorMessage = error.response?.data?.message || error.message;
      set({ cancelPickUpError: errorMessage, isLoadingPickUp: false });
      throw error;
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
      return response;
    } catch (error) {
      console.error("Error starting delivery:", error);
      set({ startDeliveryError: error.message, isLoadingStartDelivery: false });
    }
  },

  isLoadingConfirmDelivery: false,
  confirmDeliveryError: null,
  confirmDelivery: async (formData) => {
    try {
      set({ isLoadingConfirmDelivery: true, confirmDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/confirm-delivered`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ isLoadingConfirmDelivery: false });
      return response;
    } catch (error) {
      console.error(
        "Error confirming delivery:",
        error.response?.data?.message
      );
      set({
        confirmDeliveryError: error.response?.data?.message,
        isLoadingConfirmDelivery: false,
      });
    }
  },

  isLoadingCancelDelivery: false,
  cancelDeliveryError: null,
  cancelDelivery: async (formData) => {
    try {
      set({ isLoadingCancelDelivery: true, cancelDeliveryError: null });
      const response = await axiosClient.post(
        `/driver/cancel-delivery`,
        formData
      );
      set({ isLoadingCancelDelivery: false });
      return response;
    } catch (error) {
      console.error("Error delivery delivery:", error.response);
      set({
        cancelDeliveryError: error.message,
        isLoadingCancelDelivery: false,
      });
    }
  },

  isLoadingFinishDelivery: false,
  finishDeliveryError: null,
  finishDelivery: async (orderId) => {
    try {
      set({ isLoadingFinishDelivery: true, finishDeliveryError: null });
      const response = await axiosClient.post(
        `driver/confirm-delivery-success?orderId=${orderId}`
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

  isLoadingCancelNoshow: false,
  cancelNoshowError: null,
  cancelNoshow: async (orderId) => {
    try {
      set({ isLoadingCancelNoshow: true, cancelNoshowError: null });
      const response = await axiosClient.post(
        `/driver/${orderId}/delivery/cancel/noshow`
      );
      set({ isLoadingCancelNoshow: false });
      return response.data;
    } catch (error) {
      console.error("Error confirming delivery:", error);
      set({
        cancelNoshowError: error.response.data.message,
        isLoadingCancelNoshow: false,
      });
    }
  },

  cancelPickupNoshow: async (orderId) => {
    try {
      set({ isLoadingCancelNoshow: true, cancelNoshowError: null });
      const response = await axiosClient.post(
        `/driver/${orderId}/pickup/cancel/noshow`
      );
      set({ isLoadingCancelNoshow: false });
      return response;
    } catch (error) {
      console.error("Error confirming pick up:", error);
      set({
        cancelNoshowError: error.response.data.message,
        isLoadingCancelNoshow: false,
      });
    }
  },
}));
export default useOrderStore;
