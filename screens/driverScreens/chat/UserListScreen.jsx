import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { TextInput } from "react-native-paper";
import useAuthStore from "../../../api/store/authStore";
import useChatStore from "../../../api/store/chatStore";
import Ionicons from "react-native-vector-icons/Ionicons";
function UserListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const { userDetail } = useAuthStore();
  const { fetchConversations, conversations, isLoading } = useChatStore();
  const currentUserId = userDetail?.userId;

  // Fetch conversations from API
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        fetchConversations(currentUserId);
      }
    }, [currentUserId])
  );

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(
      (conversation) =>
        conversation.userTwoFullName &&
        conversation.userTwoFullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Display data logic - now checking for empty state instead of using dummy data
  const displayData = filteredConversations;

  const formatTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const diffInMilliseconds = now - new Date(date);

    // Less than a minute (giây - seconds)
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    if (diffInSeconds < 60) {
      return diffInSeconds <= 1 ? "vừa xong" : `${diffInSeconds} giây trước`;
    }

    // Less than an hour (phút - minutes)
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    // Less than a day (giờ - hours)
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }

    // Less than a week (ngày - days)
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    }

    // Less than a month (tuần - weeks)
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} tuần trước`;
    }

    // Less than a year (tháng - months)
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} tháng trước`;
    }

    // More than a year (năm - years)
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} năm trước`;
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate("ChatScreen", {
            chatId: item.conversationid,
            currentUserId: currentUserId,
            avatar: item.userTwoAvatar,
            name: item.userTwoFullName,
          })
        }
      >
        {item.userTwoAvatar ? (
          <Image source={{ uri: item.userTwoAvatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: "#eee",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Ionicons name="person" size={28} color="#888" />
          </View>
        )}
        <View style={styles.chatInfo}>
          <View style={styles.nameTimeRow}>
            <Text style={styles.name}>{item.userTwoFullName}</Text>
            <Text style={styles.time}>{formatTime(item.lastMessageDate)}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={styles.message} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#63B35C" />
        <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Tìm kiếm tên người dùng"
        mode="outlined"
        onChangeText={setSearchQuery}
        value={searchQuery}
        left={<TextInput.Icon icon="magnify" />}
        style={{ backgroundColor: "#E9EAEB", margin: 20 }}
        theme={{ colors: { primary: "#E9EAEB", outline: "#E9EAEB" } }}
        outlineColor="#E9EAEB"
      />

      {displayData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không tìm thấy người dùng nào</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, index) =>
            (item.id || item.conversationId || index).toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  listContainer: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  time: {
    fontSize: 12,
    color: "#999999",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  message: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: "#5B8DF6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default UserListScreen;
