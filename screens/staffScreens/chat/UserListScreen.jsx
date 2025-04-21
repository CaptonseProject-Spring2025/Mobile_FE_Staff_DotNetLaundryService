import React, { useEffect, useState } from "react";
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
import axiosClient from "../../../api/config/axiosClient";
import useAuthStore from "../../../api/store/authStore";

function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeUserId, setActiveUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { userDetail } = useAuthStore();
  const currentUserId = userDetail?.userId;

  // Fetch users từ API
  const fetchUsers = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await axiosClient.get("/users", {
        params: {
          role: "Customer",
          page: pageNumber,
          pageSize: 10,
        },
      });

      const newUsers = response.data.data;

      if (pageNumber === 1) {
        setUsers(newUsers);
        setFilteredUsers(newUsers);
      } else {
        const updatedUsers = [...users, ...newUsers];
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
      }

      if (newUsers.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Gọi API khi màn hình được mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.fullName &&
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Tải thêm dữ liệu khi kéo tới cuối danh sách
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchUsers(page + 1);
      setPage((prevPage) => prevPage + 1);
    }
  };

  const startConversation = async (receiverId) => {
    try {
      const response = await axiosClient.get(
        `Conversations/${receiverId}?currentUserId=${currentUserId}`
      );
      const data = response.data;

      if (!data.exists) {
        const createResponse = await axiosClient.post("/Conversations", {
          userOneId: currentUserId,
          userTwoId: receiverId,
        });

        navigation.navigate("ChatScreen", {
          conversationId: createResponse.data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
          name: users.find(user => user.userId === receiverId)?.fullName || "User",
          avatar: users.find(user => user.userId === receiverId)?.avatar || 
            "https://randomuser.me/api/portraits/lego/1.jpg"
        });
      } else {
        navigation.navigate("ChatScreen", {
          conversationId: data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
          name: users.find(user => user.userId === receiverId)?.fullName || "User",
          avatar: users.find(user => user.userId === receiverId)?.avatar || 
            "https://randomuser.me/api/portraits/lego/1.jpg"
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Format time for last active status (placeholder function)
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render user item with chatList.jsx styling
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        setActiveUserId(item.userId);
        startConversation(item.userId);
      }}
    >
      <Image
        source={{
          uri: item.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"
        }}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.nameTimeRow}>
          <Text style={styles.name}>{item.fullName || "User"}</Text>
          <Text style={styles.time}>{formatTime(item.lastActive)}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.message} numberOfLines={1}>
            {item.phoneNumber || "Tap to start conversation"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      
      {filteredUsers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không tìm thấy người dùng nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#63B35C" />
              </View>
            )
          }
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