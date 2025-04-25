import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import useNotificationStore from "../../../api/store/notificationStore";
import useAuthStore from "../../../api/store/authStore";
import { Ionicons } from "@expo/vector-icons";

import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

// Memoized notification item component to prevent unnecessary re-renders
const NotificationItem = memo(
  ({
    item,
    index,
    onPress,
    onDelete,
    onViewOrder,
    swipeableRef,
    closeOtherSwipeables,
  }) => {
    return (
      <GestureHandlerRootView>
        <Swipeable
          ref={(ref) => (swipeableRef.current[index] = ref)}
          renderLeftActions={() => {
            return (
              <View style={styles.leftActions}>
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => onViewOrder(item.orderId, item.notificationType)}
                >
                  <Ionicons name="receipt-outline" size={24} color="#fff" />
                  <Text style={styles.actionText}>Xem đơn</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          renderRightActions={() => {
            return (
              <View style={styles.rightActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDelete(item.notificationId, index)}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
          onSwipeableOpen={() => closeOtherSwipeables(index)}
          leftThreshold={30}
          rightThreshold={40}
        >
          <TouchableOpacity
            style={[
              styles.notificationItem,
              !item.isRead && styles.unreadNotification,
            ]}
            onPress={() => onPress(item)}
          >
            <View style={styles.notificationIcon}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#02A257"
              />
            </View>

            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </Swipeable>
      </GestureHandlerRootView>
    );
  }
);

const NotificationList = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const {
    notificationList,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    clearNotifications,
    readAll,
    isLoadingreadAll,
    deleteAll,
    isLoadingDeleteAll,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);
  const swipeableRefs = useRef([]);

  useEffect(() => {
    const handleNotifications = async () => {
      try {
        if (!isAuthenticated) {
          // Clear notifications once when logging out
          setLocalNotifications([]);
          clearNotifications();
          return;
        }

        // Fetch notifications when authenticated
        await fetchNotifications();
      } catch (error) {
        console.error("Error handling notifications:", error);
      }
    };

    handleNotifications();
  }, [isAuthenticated]);

  // Update local state when notification list changes
  useEffect(() => {
    if (isAuthenticated && notificationList) {
      setLocalNotifications(notificationList);
    }
  }, [notificationList, isAuthenticated]);

  // Pull to refresh functionality - memoized
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  // Handle notification press - memoized
  const handleNotificationPress = useCallback(
    async (notification) => {
      // Mark as read if not already
      if (!notification.isRead) {
        await markAsRead(notification.notificationId);

        // Update local state immediately
        setLocalNotifications((prevNotifications) =>
          prevNotifications.map((item) =>
            item.notificationId === notification.notificationId
              ? { ...item, isRead: true }
              : item
          )
        );
      }
    },
    [markAsRead]
  );

  // Delete notification handler - memoized
  const handleDeleteNotification = useCallback(
    (notificationId, index) => {
      Alert.alert("Xóa thông báo", "Bạn có muốn xóa thông báo này không?", [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteNotification(notificationId);
              // Update local state to remove the notification
              setLocalNotifications((prevNotifications) =>
                prevNotifications.filter(
                  (item) => item.notificationId !== notificationId
                )
              );
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa thông báo. Vui lòng thử lại.");
            }
          },
          style: "destructive",
        },
      ]);
    },
    [deleteNotification]
  );

  // Navigate to order detail - memoized
  const handleViewOrder = useCallback(
    (orderId, notificationType) => {
      if (notificationType === "AssignedPickup") {
        navigation.navigate("Trang chủ", {
          screen: "DriverPickupScreen",
          params: { orderId },
        });
      } else if (notificationType === "AssignedDelivery") {
        navigation.navigate("Trang chủ", {
          screen: "DriverDeliveryScreen",
          params: { orderId },
        });
      } else {
        navigation.navigate("Trang chủ", {
          screen: "DriverMenu",
        });
      }
    },
    [navigation]
  );

  // Close all other swipeables when one is opened - memoized
  const closeOtherSwipeables = useCallback((index) => {
    swipeableRefs.current.forEach((ref, i) => {
      if (ref && i !== index) {
        ref.close();
      }
    });
  }, []);

  // Render a notification item - memoized
  const renderNotificationItem = useCallback(
    ({ item, index }) => (
      <NotificationItem
        item={item}
        index={index}
        onPress={handleNotificationPress}
        onDelete={handleDeleteNotification}
        onViewOrder={handleViewOrder}
        swipeableRef={swipeableRefs}
        closeOtherSwipeables={closeOtherSwipeables}
      />
    ),
    [
      handleNotificationPress,
      handleDeleteNotification,
      handleViewOrder,
      closeOtherSwipeables,
    ]
  );

  // Key extractor - memoized
  const keyExtractor = useCallback(
    (item) => item.notificationId?.toString() || Math.random().toString(),
    []
  );

  // Show empty state if no notifications
  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
      </View>
    ),
    []
  );

  const handleReadAll = async () => {
    try {
      await readAll();
      await fetchNotifications();
    } catch (error) {
      console.error("Error reading all notifications:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      Alert.alert(
        "Xoá tất cả thông báo",
        "Bạn có chắc chắn muốn xoá tất cả thông báo không?",
        [
          {
            text: "Huỷ",
            style: "cancel",
          },
          {
            text: "Xoá",
            onPress: async () => {
              try {
                await deleteAll();
                await fetchNotifications();
              } catch (error) {
                console.error("Error deleting all notifications:", error);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  if (isLoadingreadAll || isLoadingDeleteAll) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#63B35C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#02A257"
          style={styles.loading}
        />
      ) : (
        <>
          <FlatList
            data={localNotifications}
            keyExtractor={keyExtractor}
            renderItem={renderNotificationItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#02A257"]}
              />
            }
            ListHeaderComponent={
              isAuthenticated && localNotifications.length > 0 ? (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleReadAll}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color="#02A257"
                    />
                    <Text style={styles.actionButtonTextGreen}>Đọc tất cả</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDeleteAll}
                  >
                    <Ionicons name="trash-outline" size={18} color="#F44336" />
                    <Text style={styles.actionButtonTextRed}>Xoá tất cả</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListEmptyComponent={renderEmptyState}
            windowSize={5}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            initialNumToRender={8}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "#ffff",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f7ef",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  notificationBody: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#02A257",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  rightActions: {
    width: 70,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#F44336",
    width: 60,
    height: "80%",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  leftActions: {
    width: 100,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  orderButton: {
    backgroundColor: "#02A257",
    width: 90,
    height: "80%",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 999,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonTextGreen: {
    color: "#02A257",
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtonTextRed: {
    color: "#F44336",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default NotificationList;
