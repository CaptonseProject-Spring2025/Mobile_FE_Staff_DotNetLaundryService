import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import useStaticsStore from "../../../api/store/statistcStore";

const StatisticScreen = () => {
  const [timeRange, setTimeRange] = useState("day");
  const {
    dailyStats,
    weeklyStats,
    monthlyStats,
    dailyList,
    weeklyList,
    monthlyList,
    isLoading,
    Error,
    fetchDailyStatistics,
    fetchDailyStatisticsList,
    fetchWeeklyStatistics,
    fetchWeeklyStatisticsList,
    fetchMonthlyStatistics,
    fetchMonthlyStatisticsList,
  } = useStaticsStore();

  useEffect(() => {
    fetchInitialStatistics();
  }, []);

  const fetchInitialStatistics = async () => {
    const today = getTodayDate();
    await fetchDailyStatistics(today);
    await fetchDailyStatisticsList(today);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getCurrentYearMonth = () => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    };
  };

  const handleDayPress = async () => {
    setTimeRange("day");
    const today = getTodayDate();
    await fetchDailyStatistics(today);
    await fetchDailyStatisticsList(today);
  };

  const handleWeekPress = async () => {
    setTimeRange("week");
    const today = getTodayDate();
    await fetchWeeklyStatistics(today);
    await fetchWeeklyStatisticsList(today);
  };

  const handleMonthPress = async () => {
    setTimeRange("month");
    const { year, month } = getCurrentYearMonth();
    await fetchMonthlyStatistics(year, month);
    await fetchMonthlyStatisticsList(year, month);
  };
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 đ";
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
  };

  const renderItem = ({ item }) => {
    let assignmentStatusLabel = "";
    if (item.assignmentStatus === "PICKUP_SUCCESS") {
      assignmentStatusLabel = "Đơn đi lấy";
    } else if (item.assignmentStatus === "DELIVERY_SUCCESS") {
      assignmentStatusLabel = "Đơn đi giao";
    } else {
      assignmentStatusLabel = item.assignmentStatus || "";
    }

    return (
      <View style={styles.taskItem}>
        <View>
          <Text style={styles.orderCode}>Mã đơn: {item.orderId}</Text>
          <Text className="text-base font-medium">
            Loại task: {assignmentStatusLabel}
          </Text>
          <Text style={styles.taskTime}>{item.completedAt}</Text>
        </View>
        <Text style={styles.taskAmount}>{formatCurrency(item.totalPrice)}</Text>
      </View>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>Chưa có thông tin</Text>
      </View>
    );
  };

  // Get current active data based on selected timeRange
  const getCurrentData = () => {
    if (timeRange === "day") return dailyStats;
    if (timeRange === "week") return weeklyStats;
    if (timeRange === "month") return monthlyStats;
    return dailyStats;
  };

  const getCurrentList = () => {
    if (timeRange === "day") return dailyList;
    if (timeRange === "week") return weeklyList;
    if (timeRange === "month") return monthlyList;
    return dailyList; // default to daily
  };

  const getMonthName = () => {
    const date = new Date();
    return `Tháng ${date.getMonth() + 1}`;
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.timeSelector}>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "day" && styles.activeTimeButton,
          ]}
          onPress={handleDayPress}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "day" && styles.activeTimeText,
            ]}
          >
            Ngày
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "week" && styles.activeTimeButton,
          ]}
          onPress={handleWeekPress}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "week" && styles.activeTimeText,
            ]}
          >
            Tuần
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "month" && styles.activeTimeButton,
          ]}
          onPress={handleMonthPress}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "month" && styles.activeTimeText,
            ]}
          >
            Tháng
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.statCard}>
          <Text style={styles.cardTitle}>
            {timeRange === "day"
              ? "Hôm nay"
              : timeRange === "week"
              ? "Tuần này"
              : getMonthName()}
          </Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng số chuyến</Text>
              <Text style={styles.statValue}>
                {getCurrentData().totalOrdersCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng tiền thu hộ</Text>
              <Text style={styles.statValue}>
                {formatCurrency(getCurrentData().cashTotalAmount)}
              </Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng đơn tiền mặt</Text>
              <Text style={styles.statValue}>
                {getCurrentData().cashOrdersCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>Chi tiết đơn hàng</Text>
          <FlatList
            data={getCurrentList()}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || index.toString()}
            scrollEnabled={false}
            ListEmptyComponent={renderEmptyList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  timeSelector: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTimeButton: {
    backgroundColor: "#63B35C",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  activeTimeText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#63B35C",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    width: "48%",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  tasksContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    marginBottom: 30,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  taskTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  taskAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#63B35C",
  },
  emptyListContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  taskType: {
    fontSize: 16,
    fontWeight: "medium",
    color: "#333",
  },
});

export default StatisticScreen;
