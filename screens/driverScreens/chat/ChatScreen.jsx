import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../../api/config/axiosClient";
import { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { HubConnectionBuilder } from "@microsoft/signalr";
import moment from "moment";

function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [connection, setConnection] = useState(null);
  const [input, setInput] = useState("");
  const route = useRoute();
  const { conversationId, userId, currentUserId } = route.params;

  // Chỉ tạo connection 1 lần
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("https://laundry.vuhai.me/chatHub")
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("✅ SignalR connected");
        setConnection(newConnection);
      })
      .catch((err) => console.error("❌ SignalR error:", err));

    return () => {
      newConnection.stop();
    };
  }, []);

  // Lắng nghe message mới từ SignalR
  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (newMessages) => {
      console.log("Received messages:", newMessages);
      setMessages(newMessages); // Ghi đè danh sách tin nhắn
    });

    return () => {
      connection.off("ReceiveMessage");
    };
  }, [connection]);

  // Join conversation và lấy lịch sử
  useEffect(() => {
    if (connection && conversationId) {
      connection.invoke("JoinConversation", conversationId);
      console.log("✅ Joined:", conversationId);

      const fetchMessages = async () => {
        try {
          const res = await axiosClient.get(
            `Conversations/messages/${conversationId}`
          );
          if (res.data.success) {
            setMessages(res.data.messages);
          }
        } catch (err) {
          console.error("❌ Fetch error:", err);
        }
      };

      fetchMessages();
    }
  }, [connection, conversationId]);

  const sendMessage = async () => {
    if (input.trim() && connection && conversationId) {
      // Tạo một đối tượng tin nhắn mới
      const newMessage = {
        user: currentUserId, // User gửi tin nhắn
        message: input, // Nội dung tin nhắn
      };

      // Cập nhật tin nhắn vào UI ngay lập tức
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      try {
        await connection.invoke(
          "SendMessage",
          currentUserId,
          conversationId,
          input
        );
        setInput("");
      } catch (err) {
        console.error("❌ SendMessage error:", err);
      }
    }
  };
  console.log("messages", messages);

  const renderMessageItem = ({ item }) => (
    <View
      className={`p-3 rounded-lg mb-3 max-w-[70%] ${
        currentUserId === item.userid
          ? "bg-green-200 self-end"
          : "bg-white self-start"
      }`}
    >
      {/* Hiển thị avatar và tên người gửi nếu không phải người dùng hiện tại */}
      {currentUserId !== item.userid && (
        <View className="flex-row items-center mb-2">
          <Image
            source={{
              uri: item.avatar || "https://yourfallback.com/avatar-default.png",
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 10,
            }}
          />
          <Text className="text-sm font-bold text-gray-600">
            {item.fullname}
          </Text>
        </View>
      )}

      {/* Nội dung tin nhắn */}
      <Text className="text-base text-gray-800">{item.message1}</Text>

      {/* Hiển thị thời gian gửi tin nhắn */}
      <Text className="text-xs text-gray-500 mt-1 text-right">
        {moment(item.creationdate).fromNow()}
      </Text>

      {/* Hiển thị "(Tôi)" nếu là tin nhắn của người dùng hiện tại */}
      {currentUserId === item.userid && (
        <Text className="text-xs text-gray-500 mt-1 text-right">(Tôi)</Text>
      )}
    </View>
  );
  console.log("currentUserId", currentUserId);

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => index.toString()}
        className="flex-1"
      />
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 10,
            borderRadius: 30,
            marginRight: 10,
          }}
          placeholder="Nhập tin nhắn"
        />
        <TouchableOpacity onPress={sendMessage} style={{ padding: 10 }}>
          <Text style={{ fontSize: 18, color: "#4CAF50" }}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ChatScreen;
