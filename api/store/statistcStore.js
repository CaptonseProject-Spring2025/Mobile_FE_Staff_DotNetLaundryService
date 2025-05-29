import { create } from "zustand";
import axiosClient from "../config/axiosClient";

const useStaticsStore = create((set) => ({
  dailyStats: {},
  isLoading: false,
  Error: null,
  fetchDailyStatistics: async (date) => {
    try {
      set({ isLoading: true, Error: null });
      const response = await axiosClient.get(
        `/driver/statistics/daily?date=${date}`
      );
      set({ dailyStats: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
  dailyList: [],
  fetchDailyStatisticsList: async (date) => {
    try {
      set({ isLoading: true, Error: null });
      const response = await axiosClient.get(
        `/driver/statistics/daily/list?date=${date}`
      );
      set({ dailyList: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
  weeklyStats: {
    completedTasks: 0,
    revenue: 0,
    salary: 0,
    expenses: 0,
  },
  fetchWeeklyStatistics: async (date) => {
    set({ isLoading: true, Error: null });
    try {
      // Convert date to ISO format with timezone if it's not already
      const isoDate = date.includes("T") ? date : new Date(date).toISOString();
      const response = await axiosClient.get(
        `/driver/statistics/weekly?dateInWeek=${isoDate}`
      );
      set({ weeklyStats: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  weeklyList: [],
  fetchWeeklyStatisticsList: async (date) => {
    try {
      set({ isLoading: true, Error: null });
      const response = await axiosClient.get(
        `/driver/statistics/weekly/list?dateInWeek=${date}`
      );
      set({ weeklyList: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
  monthlyStats: {
    completedTasks: 0,
    revenue: 0,
    salary: 0,
    expenses: 0,
  },
  fetchMonthlyStatistics: async (year, month) => {
    try {
      set({ isLoading: true, Error: null });
      const response = await axiosClient.get(
        `/driver/statistics/monthly?year=${year}&month=${month}`
      );
      set({ monthlyStats: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  monthlyList: [],
  fetchMonthlyStatisticsList: async (year, month) => {
    try {
      set({ isLoading: true, Error: null });
      const response = await axiosClient.get(
        `/driver/statistics/monthly/list?year=${year}&month=${month}`
      );
      set({ monthlyList: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({
        Error: error.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
}));

export default useStaticsStore;
