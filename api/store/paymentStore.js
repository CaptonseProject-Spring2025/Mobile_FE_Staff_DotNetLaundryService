import { create } from "zustand";
import axiosClient from "../config/axiosClient";

const usePaymentStore = create((set) => ({
  isLoadingPayment: false,
  paymentError: null,
  createPayment: async (formdata) => {
    try {
      set({ isLoadingPayment: true, paymentError: null });
      const response = await axiosClient.post(`/payments/payos/link`, formdata);
      set({ isLoadingPayment: false });
      return response;
    } catch (error) {
      set({ paymentError: error.message, isLoadingPayment: false });
    }
  },
}));

export default usePaymentStore;
