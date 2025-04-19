import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import axiosClient from "../../../api/config/axiosClient";
import useAuthStore from "../../../api/store/authStore";

function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
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
          role: "Admin",
          page: pageNumber,
          pageSize: 10,
        },
      });

      const newUsers = response.data.data;

      if (pageNumber === 1) {
        setUsers(newUsers);
      } else {
        setUsers((prevUsers) => [...prevUsers, ...newUsers]);
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
        });
      } else {
        navigation.navigate("ChatScreen", {
          conversationId: data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Render từng user
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 border-b border-gray-200 ${
        activeUserId === item.userId ? "bg-blue-100" : "bg-white"
      }`}
      onPress={() => {
        setActiveUserId(item.userId);
        startConversation(item.userId);
      }}
    >
      {/* Hiển thị avatar */}
      <Image
        source={{
          uri:
            item.avatar ||
            "data:image/jpeg;base64,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",
        }}
        className="w-12 h-12 rounded-full mr-4"
      />
      {/* Hiển thị thông tin người dùng */}
      <View className="flex-1">
        <Text className="font-bold text-lg text-gray-800">{item.fullName}</Text>
        <Text className="text-sm text-gray-600">
          Email: {item.email || "Không có"}
        </Text>
        <Text className="text-sm text-gray-600">
          SĐT: {item.phoneNumber || "Chưa cập nhật số điện thoại"}
        </Text>
        <Text className="text-sm text-gray-600">
          Role: {item.role || "Chưa cập nhật vai trò"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Hiển thị loading khi tải lần đầu
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-4 text-lg text-gray-600">
          Đang tải danh sách người dùng...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Tiêu đề */}
      <View className="pt-8 pb-4 px-4 bg-green-500 rounded-b-lg mb-4">
        <Text className="text-2xl font-bold text-white text-center">
          Danh sách người dùng
        </Text>
      </View>

      {/* Danh sách người dùng */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore && (
            <View className="py-4">
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text className="mt-2 text-center text-sm text-gray-600">
                Đang tải thêm...
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

export default UserListScreen;