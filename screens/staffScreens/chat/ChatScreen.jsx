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
  
  // Debug messages state
  useEffect(() => {
    console.log("🔍 Messages state changed:", {
      isArray: Array.isArray(messages),
      length: messages?.length || 0,
      type: typeof messages,
      firstItem: messages?.[0] ? "exists" : "none"
    });
  }, [messages]);

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

  // BULLETPROOF SignalR listeners
  useEffect(() => {
    if (!connection) return;

    const handleNewMessage = (messageData) => {
      console.log("📨 New message received:", messageData);
      
      // Double check: messageData should be an object, not array
      if (messageData && typeof messageData === 'object' && !Array.isArray(messageData)) {
        setMessages(prevMessages => {
          // Ensure prevMessages is always an array
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
          
          // Check if message already exists to avoid duplicates
          const messageId = messageData.messageid || messageData.Messageid;
          if (messageId && currentMessages.some(msg => (msg.messageid || msg.Messageid) === messageId)) {
            console.log("🔄 Message already exists, skipping");
            return currentMessages;
          }
          
          // Add new message and sort by creation date
          const newMessages = [...currentMessages, messageData];
          const sortedMessages = newMessages.sort((a, b) => {
            const dateA = new Date(a.creationdate || a.Creationdate || 0);
            const dateB = new Date(b.creationdate || b.Creationdate || 0);
            return dateA - dateB;
          });
          
          console.log("✅ Added new message, total:", sortedMessages.length);
          return sortedMessages;
        });
        
        // Scroll to bottom after adding message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error("❌ Invalid messageData received:", messageData);
      }
    };

    const handleReceiveMessages = (messagesData) => {
      console.log("📋 Received messages array:", messagesData);
      
      // Ensure messagesData is an array
      if (Array.isArray(messagesData)) {
        setMessages([...messagesData]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } else {
        console.error("❌ Expected array but received:", typeof messagesData, messagesData);
        // Set empty array as fallback
        setMessages([]);
      }
    };

    connection.on("ReceiveMessage", handleNewMessage);
    connection.on("ReceiveMessages", handleReceiveMessages);

    return () => {
      connection.off("ReceiveMessage", handleNewMessage);
      connection.off("ReceiveMessages", handleReceiveMessages);
    };
  }, [connection, conversationId]);

  // Fetch initial messages
  useEffect(() => {
    if (connection && conversationId) {
      connection.invoke("JoinConversation", conversationId);
      
      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          console.log("🔄 Fetching initial messages for conversation:", conversationId);
          
          const res = await axiosClient.get(`Conversations/messages/${conversationId}`);
          console.log("📥 API Response:", res.data);
          
          if (res.data && res.data.success) {
            const messagesData = res.data.messages;
            if (Array.isArray(messagesData)) {
              console.log("✅ Setting initial messages, count:", messagesData.length);
              setMessages([...messagesData]); // Force new array reference
            } else {
              console.warn("⚠️ Messages data is not an array:", typeof messagesData, messagesData);
              setMessages([]);
            }
          } else {
            console.warn("⚠️ API response not successful");
            setMessages([]);
          }
        } catch (err) {
          console.error("❌ Fetch messages error:", err);
          setMessages([]);
        } finally {
          setIsLoading(false);
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

  // SIMPLE format time
  const formatTime = (date) => {
    if (!date) return "";
    try {
      const now = new Date();
      const messageDate = new Date(date);
      const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
      
      if (diffInMinutes < 1) return "vừa xong";
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    } catch (error) {
      return "";
    }
  };

  // SIMPLE render - NO GROUPING
  const renderMessage = ({ item, index }) => {
    if (!item) return null;

    const isCurrentUser = (item.userid || item.Userid) === currentUserId;
    const messageText = item.message1 || item.Message1 || "";
    const messageDate = item.creationdate || item.Creationdate;
    const userAvatar = item.avatar || item.Avatar;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer,
        ]}
      >
        {!isCurrentUser && (
          <Image
            source={{ uri: userAvatar || avatar || "https://randomuser.me/api/portraits/lego/1.jpg" }}
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
              isCurrentUser ? styles.currentUserMessageText : styles.otherUserMessageText,
            ]}
          >
            {messageText}
          </Text>
          <Text
            style={[
              styles.timeText,
              isCurrentUser ? styles.currentUserTimeText : styles.otherUserTimeText,
            ]}
          >
            {formatTime(messageDate)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
          data={Array.isArray(messages) ? messages : []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => {
            const key = item?.messageid || item?.Messageid || `message-${index}`;
            return String(key);
          }}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            console.log("📊 FlatList content changed, messages count:", messages?.length || 0);
          }}
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
