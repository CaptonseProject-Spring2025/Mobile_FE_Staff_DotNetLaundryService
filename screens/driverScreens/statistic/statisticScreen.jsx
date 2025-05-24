import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const StatisticScreen = () => {
  const [timeRange, setTimeRange] = useState("day"); // 'day', 'week', 'month'

  // Sample data - sẽ thay bằng data thực tế từ API
  const statisticData = {
    day: {
      completedTasks: 5,
      revenue: 250000,
      salary: 100000,
      expenses: 30000,
      tasks: [
        { id: "1", orderCode: "#123456", amount: 50000, time: "09:30" },
        { id: "2", orderCode: "#123457", amount: 45000, time: "10:45" },
        { id: "3", orderCode: "#123458", amount: 60000, time: "13:20" },
        { id: "4", orderCode: "#123459", amount: 55000, time: "15:10" },
        { id: "5", orderCode: "#123460", amount: 40000, time: "17:30" },
      ],
    },
    week: {
      completedTasks: 32,
      revenue: 1600000,
      salary: 670000,
      expenses: 150000,
      tasks: [
        { id: "1", orderCode: "#123461", amount: 50000, time: "Thứ 2" },
        { id: "2", orderCode: "#123462", amount: 250000, time: "Thứ 3" },
        { id: "3", orderCode: "#123463", amount: 300000, time: "Thứ 4" },
        { id: "4", orderCode: "#123464", amount: 280000, time: "Thứ 5" },
        { id: "5", orderCode: "#123465", amount: 320000, time: "Thứ 6" },
        { id: "6", orderCode: "#123466", amount: 240000, time: "Thứ 7" },
        { id: "7", orderCode: "#123467", amount: 160000, time: "Chủ nhật" },
      ],
    },
    month: {
      completedTasks: 120,
      revenue: 6000000,
      salary: 2500000,
      expenses: 600000,
      tasks: [
        { id: "1", orderCode: "Tuần 1", amount: 1500000, time: "01-07/10" },
        { id: "2", orderCode: "Tuần 2", amount: 1600000, time: "08-14/10" },
        { id: "3", orderCode: "Tuần 3", amount: 1450000, time: "15-21/10" },
        { id: "4", orderCode: "Tuần 4", amount: 1450000, time: "22-31/10" },
      ],
    },
  };

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <View>
        <Text style={styles.orderCode}>{item.orderCode}</Text>
        <Text style={styles.taskTime}>{item.time}</Text>
      </View>
      <Text style={styles.taskAmount}>{formatCurrency(item.amount)}</Text>
    </View>
  );

  const activeData = statisticData[timeRange];

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
          onPress={() => setTimeRange("day")}
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
          onPress={() => setTimeRange("week")}
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
          onPress={() => setTimeRange("month")}
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
              <Text style={styles.statValue}>{activeData.completedTasks}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng tiền thu hộ</Text>
              <Text style={styles.statValue}>
                {formatCurrency(activeData.revenue)}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tiền lương</Text>
              <Text style={styles.statValue}>
                {formatCurrency(activeData.salary)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Chi phí ngoài</Text>
              <Text style={styles.statValue}>
                {formatCurrency(activeData.expenses)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>Chi tiết đơn hàng</Text>
          <FlatList
            data={activeData.tasks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
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
});

export default StatisticScreen;
