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

  orderChecked: [],
  isLoadingOrderChecked: false,
  orderCheckedError: null,
  fetchOrderChecked: async () => {
    try {
      set({ isLoadingOrderChecked: true, orderCheckedError: null });
      const response = await axiosClient.get(`/staff/orders/checked`);
      set({ orderChecked: response.data, isLoadingOrderChecked: false });
    } catch (error) {
      set({ orderCheckedError: error.message, isLoadingOrderChecked: false });
    }
  },


  isLoadingReciveToWashing: false,
  reciveToWashingError: null,
  reciveToWashing: async (orderId) => {
    try {
      set({ isLoadingReciveToWashing: true, reciveToWashingError: null });
      const response = await axiosClient.post(
        `/staff/orders/washing?orderId=${orderId}`
      );
      set({ isLoadingReciveToWashing: false });
      return response.data;
    } catch (error) {
      console.error("Error starting pick up:", error);
      set({
        reciveToWashingError: error.message,
        isLoadingReciveToWashing: false,
      });
    }
  },




  orderWashing: [],
  isLoadingOrderWashing: false,
  orderWashingError: null,
  fetchOrderWashing: async () => {
    try {
      set({ isLoadingOrderWashing: true, orderWashingError: null });
      const response = await axiosClient.get(`/staff/orders/washing`);
      set({ orderWashing: response.data, isLoadingOrderWashing: false });
    } catch (error) {
      set({ orderWashingError: error.message, isLoadingOrderWashing: false });
    }
  },


  orderWashed: [],
  isLoadingOrderWashed: false,
  orderWashedError: null,
  fetchOrderWashed: async () => {
    try {
      set({ isLoadingOrderWashed: true, orderWashedError: null });
      const response = await axiosClient.get(`/staff/orders/washed`);
      set({ orderWashed: response.data, isLoadingOrderWashed: false });
    } catch (error) {
      set({ orderWashedError: error.message, isLoadingOrderWashed: false });
    }
  },

  // Lịch sử trạng thái đơn hàng
  orderHistory: [],
  isLoadingOrderHistory: false,
  orderHistoryError: null,
  fetchOrderHistory: async (orderId) => {
    if (!orderId) {
      console.error("OrderId is required to fetch order history");
      return;
    }
    
    try {
      set({ isLoadingOrderHistory: true, orderHistoryError: null });
      const response = await axiosClient.get(`/orders/history/${orderId}`);
      const historyData = response.data;
      console.log("API returned history data:", historyData);
      
      // Nếu dữ liệu là chuỗi JSON, thử parse nó
      if (typeof historyData === 'string') {
        try {
          const parsedData = JSON.parse(historyData);
          console.log("Parsed history data:", parsedData);
          set({ orderHistory: parsedData, isLoadingOrderHistory: false });
          return parsedData;
        } catch (e) {
          console.error("Error parsing history data string:", e);
          set({ orderHistory: [], isLoadingOrderHistory: false });
          return [];
        }
      }
      
      // Nếu dữ liệu đã là object hoặc array
      set({ orderHistory: historyData, isLoadingOrderHistory: false });
      return historyData;
    } catch (error) {
      console.error("Error fetching order history:", error);
      set({ 
        orderHistoryError: error.response?.data?.message || error.message,
        isLoadingOrderHistory: false 
      });
      return null;
    }
  },

  // Thêm hàm để lấy hình ảnh đính kèm từ statusHistoryId
  orderStatusPhotos: null,
  isLoadingStatusPhotos: false,
  statusPhotosError: null,
  
  fetchOrderStatusPhotos: async (statusHistoryId) => {
    if (!statusHistoryId) {
      console.error("statusHistoryId is required to fetch photos");
      return null;
    }
    
    console.log("Fetching photos for statusHistoryId:", statusHistoryId);
    
    try {
      set({ isLoadingStatusPhotos: true, statusPhotosError: null });
      
      // Đúng URL như trong ảnh: https://laundry.vuhai.me/api/photos?statusHistoryId=d1fd7836-2650-4814-a178-68165233dd29
      const response = await axiosClient.get(`photos?statusHistoryId=${statusHistoryId}`);
      console.log("Status photos API response:", response.data);
      
      // Format dữ liệu trả về từ API
      let formattedPhotos = [];
      
      // Nếu dữ liệu trả về là array
      if (response.data && Array.isArray(response.data)) {
        formattedPhotos = response.data;
      } 
      // Nếu dữ liệu trả về là object duy nhất
      else if (response.data && typeof response.data === 'object') {
        formattedPhotos = [response.data];
      }
      // Nếu dữ liệu trả về là string (có thể là JSON string)
      else if (response.data && typeof response.data === 'string') {
        try {
          const parsedData = JSON.parse(response.data);
          formattedPhotos = Array.isArray(parsedData) ? parsedData : [parsedData];
        } catch (e) {
          console.error("Error parsing photos data string:", e);
        }
      }
      
      console.log("Formatted photos:", formattedPhotos);
      
      // Lưu kết quả vào store
      set({ orderStatusPhotos: formattedPhotos, isLoadingStatusPhotos: false });
      return formattedPhotos;
    } catch (error) {
      console.error("Error fetching status photos:", error);
      set({ 
        statusPhotosError: error.response?.data?.message || error.message,
        isLoadingStatusPhotos: false 
      });
      return null;
    }
  },

}));

export default useCheckOrderStore;
