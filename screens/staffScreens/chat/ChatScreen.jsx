import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../../../api/config/axiosClient";

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef(null);
  const route = useRoute();
  const { conversationId, name, userId, currentUserId, avatar } = route.params;
  
  // Initialize SignalR connection
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

  // Listen for new messages from SignalR
  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (newMessages) => {
      console.log("Received messages:", newMessages);
      setMessages(newMessages);
      // Scroll to bottom after receiving new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      connection.off("ReceiveMessage");
    };
  }, [connection]);

  // Join conversation and fetch message history
  useEffect(() => {
    if (connection && conversationId) {
      connection.invoke("JoinConversation", conversationId);
      console.log("✅ Joined conversation:", conversationId);

      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          const res = await axiosClient.get(`Conversations/messages/${conversationId}`);
          if (res.data.success) {
            setMessages(res.data.messages || []);
          }
        } catch (err) {
          console.error("❌ Fetch messages error:", err);
        } finally {
          setIsLoading(false);

          // Scroll to bottom after loading messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      };

      fetchMessages();
    }
  }, [connection, conversationId]);

  const handleSend = async () => {
    if (inputText.trim() === "" || !connection || !conversationId || !currentUserId)
      return;

    try {
      await connection.invoke(
        "SendMessage",
        currentUserId,
        conversationId,
        inputText.trim()
      );
      setInputText("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  // Format the timestamp as relative time in Vietnamese
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
    // Check if it's a date separator
    if (item.isDateSeparator) {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{formatDate(item.date)}</Text>
        </View>
      );
    }

    // For real API messages
    const isCurrentUser = item.userid === currentUserId;
    const messageText = item.message1 || item.message;
    const messageDate = item.creationdate
      ? new Date(item.creationdate)
      : new Date();

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser
            ? styles.currentUserMessageContainer
            : styles.otherUserMessageContainer,
        ]}
      >
        {!isCurrentUser && (
          <Image
            source={{ uri: item.avatar || avatar || "https://randomuser.me/api/portraits/lego/1.jpg" }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser
                ? styles.currentUserMessageText
                : styles.otherUserMessageText,
            ]}
          >
            {messageText}
          </Text>
          <Text
            style={[
              styles.timeText,
              isCurrentUser
                ? styles.currentUserTimeText
                : styles.otherUserTimeText,
            ]}
          >
            {formatTime(messageDate)}
          </Text>
        </View>
      </View>
    );
  };

  // Format date for the date separator
  const formatDate = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return "Hôm nay";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }

    return messageDate.toLocaleDateString("vi-VN");
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentDate = null;

    // Sort messages by creation date if they have one
    const sortedMessages = [...messages].sort((a, b) => {
      const dateA = a.creationdate ? new Date(a.creationdate) : new Date();
      const dateB = b.creationdate ? new Date(b.creationdate) : new Date();
      return dateA - dateB;
    });

    sortedMessages.forEach((message) => {
      const messageDate = message.creationdate
        ? new Date(message.creationdate)
        : new Date();
      const dateString = messageDate.toDateString();

      if (dateString !== currentDate) {
        currentDate = dateString;
        groups.push({
          isDateSeparator: true,
          date: messageDate,
          _id: `ngày-${dateString}`,
        });
      }

      groups.push(message);
    });

    return groups;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Chat Header */}
        <View style={styles.header}>
          <View style={styles.headerProfile}>
            <Image 
              source={{ uri: avatar || "https://randomuser.me/api/portraits/lego/1.jpg" }} 
              style={styles.avatar} 
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>{name || "Chat"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#63B35C" />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Image 
            source={{ uri: avatar || "https://randomuser.me/api/portraits/lego/1.jpg" }} 
            style={styles.avatar} 
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{name || "Chat"}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate()}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            (item._id || item.id || index).toString()
          }
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : {},
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={24}
              color={inputText.trim() ? "#FFFFFF" : "#AAAAAA"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 5,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerStatus: {
    fontSize: 12,
    color: "#63B35C",
  },
  headerButton: {
    padding: 5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  currentUserMessageContainer: {
    justifyContent: "flex-end",
  },
  otherUserMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 10,
  },
  currentUserBubble: {
    backgroundColor: "#63B35C",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    paddingHorizontal: 2,
  },
  currentUserMessageText: {
    color: "white",
  },
  otherUserMessageText: {
    color: "#333",
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  currentUserTimeText: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  otherUserTimeText: {
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  inputIcons: {
    flexDirection: "row",
    marginRight: 10,
  },
  iconButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#63B35C",
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: "rgba(200, 200, 200, 0.3)",
    color: "#666",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default ChatScreen;
