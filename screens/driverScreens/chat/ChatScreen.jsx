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
  Modal,
  Alert,
  Animated,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../../../api/config/axiosClient";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Animated Typing Dots Component
const TypingDots = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (animValue, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Animation = animateDot(dot1Anim, 0);
    const dot2Animation = animateDot(dot2Anim, 150);
    const dot3Animation = animateDot(dot3Anim, 300);

    dot1Animation.start();
    dot2Animation.start();
    dot3Animation.start();

    return () => {
      dot1Animation.stop();
      dot2Animation.stop();
      dot3Animation.stop();
    };
  }, []);

  const getDotStyle = (animValue) => ({
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, getDotStyle(dot1Anim)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot2Anim)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot3Anim)]} />
    </View>
  );
};

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const route = useRoute();
  const { chatId, name, currentUserId, avatar } = route.params;

  // Debug messages state
  useEffect(() => {
    console.log("🔍 [DRIVER] Messages state changed:", {
      isArray: Array.isArray(messages),
      length: messages?.length || 0,
      type: typeof messages,
      firstItem: messages?.[0] ? "exists" : "none"
    });
  }, [messages]);

  // Auto mark messages as read - IMPROVED
  useEffect(() => {
    if (!connection || !currentUserId || !Array.isArray(messages)) return;

    const unreadMessages = messages.filter(msg => {
      const isCurrentUser = (msg.userid || msg.Userid) === currentUserId;
      const isUnread = !(msg.isseen || msg.Isseen);
      return !isCurrentUser && isUnread;
    });

    // Auto mark messages as read after a short delay
    if (unreadMessages.length > 0) {
      const markTimer = setTimeout(() => {
        unreadMessages.forEach(msg => {
          const messageId = msg.messageid || msg.Messageid;
          if (messageId) {
            markMessageAsRead(messageId, msg.userid || msg.Userid);
          }
        });
      }, 1500); // Wait 1.5 seconds before marking as read

      return () => clearTimeout(markTimer);
    }
  }, [messages, connection, currentUserId]);

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

    const handleNewMessage = (messageData) => {
      console.log("📨 Received new message:", messageData);
      
      // messageData is a single message object, not an array
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
          
          // Auto mark as read if it's from another user
          const senderId = messageData.userid || messageData.Userid;
          if (senderId !== currentUserId && messageId) {
            setTimeout(() => {
              markMessageAsRead(messageId, senderId);
            }, 1000); // Mark as read after 1 second
          }
          
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

    connection.on("ReceiveMessage", handleNewMessage);
    connection.on("ReceiveMessages", (messagesArray) => {
      console.log("📋 Received messages array:", messagesArray);
      if (Array.isArray(messagesArray)) {
        setMessages([...messagesArray]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } else {
        console.error("❌ Expected array but received:", typeof messagesArray, messagesArray);
        setMessages([]);
      }
    });

    // Handle typing indicator - ENHANCED
    connection.on("UserTyping", (userId, userName) => {
      console.log(`⌨️ UserTyping event received: userId=${userId}, userName=${userName}, currentUserId=${currentUserId}`);
      
      if (userId !== currentUserId) {
        console.log(`✅ Setting typing indicator for ${userName}`);
        setIsTyping(true);
        setTypingUser(userName);
        
        // Clear previous timeout and set new one
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          console.log(`⏰ Typing timeout for ${userName}`);
          setIsTyping(false);
          setTypingUser(null);
        }, 3000);
      } else {
        console.log(`⚠️ Ignoring own typing event`);
      }
    });

    // Handle user stopped typing - ENHANCED
    connection.on("UserStoppedTyping", (userId) => {
      console.log(`⌨️ UserStoppedTyping event received: userId=${userId}, currentUserId=${currentUserId}`);
      
      if (userId !== currentUserId) {
        console.log(`✅ Clearing typing indicator for user ${userId}`);
        setIsTyping(false);
        setTypingUser(null);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      } else {
        console.log(`⚠️ Ignoring own stop typing event`);
      }
    });

    // Handle message deletion - DISABLED
    // connection.on("MessageDeleted", (messageId) => {
    //   setMessages(prevMessages => 
    //     prevMessages.filter(msg => 
    //       (msg.messageid || msg.Messageid) !== messageId
    //     )
    //   );
    // });

    // Handle message read status - IMPROVED
    connection.on("MessageRead", (messageId) => {
      console.log("✅ Message marked as read:", messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          const msgId = msg.messageid || msg.Messageid;
          if (msgId === messageId) {
            return { ...msg, isseen: true, Isseen: true };
          }
          return msg;
        })
      );
    });

    // Handle notification events - IMPROVED
    connection.on("ReceiveNotification", (notificationData) => {
      console.log("📢 Received notification:", notificationData);
      
      // Add notification to state
      setNotifications(prevNotifications => {
        // Check if notification already exists
        const exists = prevNotifications.some(n => n.notificationid === notificationData.notificationid);
        if (exists) return prevNotifications;
        
        return [notificationData, ...prevNotifications];
      });
      
      // Update unread count
      setUnreadCount(prevCount => prevCount + 1);
      
      // Show a brief toast or alert for new message notification
      if (notificationData.notificationtype === 'message') {
        console.log(`💬 New message from ${notificationData.senderName}: ${notificationData.message}`);
        // You can add a toast notification here if you have a toast library
      }
    });

    connection.on("UnreadNotificationCount", (count) => {
      console.log("📊 Unread notification count:", count);
      setUnreadCount(count);
    });

    connection.on("ReceiveNotifications", (notificationsList) => {
      console.log("📋 Received notifications list:", notificationsList);
      if (Array.isArray(notificationsList)) {
        setNotifications(notificationsList);
        
        // Count unread notifications
        const unreadCountValue = notificationsList.filter(n => !n.isread).length;
        setUnreadCount(unreadCountValue);
      }
    });

    connection.on("NotificationRead", (messageId) => {
      console.log("✅ Notification read for message:", messageId);
      // Update unread count
      if (connection && currentUserId) {
        connection.invoke("GetUnreadNotificationCount", currentUserId).catch(err => {
          console.error("Error getting unread count:", err);
        });
      }
    });

    // Handle online/offline status
    connection.on("UserOnline", (userId) => {
      console.log(`🟢 User ${userId} is online`);
      if (userId !== currentUserId) {
        setIsOnline(true);
      }
    });

    connection.on("UserOffline", (userId) => {
      console.log(`🔴 User ${userId} is offline`);
      if (userId !== currentUserId) {
        setIsOnline(false);
      }
    });

    return () => {
      connection.off("ReceiveMessage", handleNewMessage);
      connection.off("ReceiveMessages");
      connection.off("UserTyping");
      connection.off("UserStoppedTyping");
      // connection.off("MessageDeleted"); // Đã tắt
      connection.off("MessageRead");
      connection.off("ReceiveNotification");
      connection.off("UnreadNotificationCount");
      connection.off("ReceiveNotifications");
      connection.off("NotificationRead");
      connection.off("UserOnline");
      connection.off("UserOffline");
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connection, currentUserId]);

  // Join conversation and fetch message history
  useEffect(() => {
    if (connection && chatId) {
      connection.invoke("JoinConversation", chatId);
      console.log("✅ Joined conversation:", chatId);

      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          const res = await axiosClient.get(`Conversations/messages/${chatId}`);
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
      
      // Load notifications and unread count
      if (currentUserId) {
        connection.invoke("GetNotifications", currentUserId).catch(err => {
          console.error("Error getting notifications:", err);
        });
        
        connection.invoke("GetUnreadNotificationCount", currentUserId).catch(err => {
          console.error("Error getting unread count:", err);
        });
        
        // Set user online status
        connection.invoke("SetUserOnline", currentUserId, chatId).catch(err => {
          console.error("Error setting user online:", err);
        });
      }
    }
  }, [connection, chatId, currentUserId]);

  // Set user offline when leaving
  useEffect(() => {
    return () => {
      if (connection && currentUserId && chatId) {
        connection.invoke("SetUserOffline", currentUserId, chatId).catch(err => {
          console.error("Error setting user offline:", err);
        });
      }
    };
  }, [connection, currentUserId, chatId]);

  const handleSend = async () => {
    if (inputText.trim() === "" || !connection || !chatId || !currentUserId)
      return;

    const messageText = inputText.trim();
    
    try {
      // Clear input immediately for better UX
      setInputText("");
      
      // Try to stop typing indicator - but don't fail if it doesn't work
      try {
        console.log("🛑 Stopping typing indicator before sending message");
        await connection.invoke("StopTyping", currentUserId, chatId);
      } catch (typingError) {
        console.warn("⚠️ Could not stop typing indicator:", typingError.message);
      }
      
      console.log("📤 Sending message:", messageText);
      await connection.invoke(
        "SendMessage",
        currentUserId,
        chatId,
        messageText
      );
      
      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Restore input text if sending failed
      setInputText(messageText);
    }
  };

  // Handle typing indicator - ENHANCED
  const handleInputChange = async (text) => {
    setInputText(text);
    
    if (!connection || !chatId || !currentUserId) {
      console.log("❌ Missing connection, chatId, or currentUserId for typing");
      return;
    }
    
    try {
      if (text.trim().length > 0) {
        console.log("⌨️ User started typing...");
        await connection.invoke("StartTyping", currentUserId, chatId);
      } else {
        console.log("⌨️ User stopped typing...");
        await connection.invoke("StopTyping", currentUserId, chatId);
      }
    } catch (error) {
      console.error("❌ Error handling typing:", error);
      // Don't throw error for typing - it's not critical
    }
  };

  // Handle message deletion - IMPROVED
  const handleDeleteMessage = async (messageId) => {
    if (!connection || !messageId || !currentUserId) return;

    try {
      console.log(`🗑️ Deleting message: ${messageId}`);
      
      // Show loading state
      setSelectedMessage(prev => ({ ...prev, isDeleting: true }));
      
      await connection.invoke("DeleteMessage", messageId, currentUserId);
      
      // Close modal and clear selection
      setShowDeleteModal(false);
      setSelectedMessage(null);
      
      console.log(`✅ Message ${messageId} deleted successfully`);
    } catch (error) {
      console.error("❌ Error deleting message:", error);
      
      // Reset loading state
      setSelectedMessage(prev => ({ ...prev, isDeleting: false }));
      
      Alert.alert(
        "Lỗi xóa tin nhắn", 
        "Không thể xóa tin nhắn. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    }
  };

  // Handle long press on message - ENHANCED
  const handleMessageLongPress = (message) => {
    const isCurrentUser = (message.userid || message.Userid) === currentUserId;
    const messageStatus = message.status || message.Status;
    
    // Only allow deletion of own messages that aren't already deleted
    if (isCurrentUser && messageStatus !== "deleted") {
      console.log(`🔨 Long press on message: ${message.messageid || message.Messageid}`);
      
      // Add haptic feedback if available
      try {
        if (Platform.OS === 'ios') {
          // iOS haptic feedback
          const HapticFeedback = require('react-native').HapticFeedback;
          HapticFeedback?.trigger('impactMedium');
        }
      } catch (e) {
        console.log('Haptic feedback not available');
      }
      
      setSelectedMessage(message);
      setShowDeleteModal(true);
    } else if (!isCurrentUser) {
      console.log("Cannot delete other user's message");
    } else if (messageStatus === "deleted") {
      console.log("Message already deleted");
    }
  };

  // Mark message as read when other user's message is displayed - IMPROVED
  const markMessageAsRead = async (messageId, senderId) => {
    if (!connection || !messageId || senderId === currentUserId) return;
    
    try {
      console.log(`📖 Marking message ${messageId} as read`);
      await connection.invoke("MarkMessageAsRead", messageId, currentUserId);
    } catch (error) {
      console.error("❌ Error marking message as read:", error);
    }
  };

  // Handle notification press - IMPROVED
  const handleNotificationPress = async (notification) => {
    console.log("📱 Notification pressed:", notification);
    
    // Mark notification as read if it's unread
    if (!notification.isread && connection && currentUserId) {
      try {
        // Update local state immediately
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.notificationid === notification.notificationid 
              ? { ...n, isread: true }
              : n
          )
        );
        
        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        
        // Invoke backend to mark as read
        await connection.invoke("MarkNotificationAsRead", notification.notificationid, currentUserId);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    // Close notification modal
    setShowNotifications(false);
    
    // If it's a message notification, you could navigate to that conversation
    if (notification.notificationtype === 'message' && notification.conversationId) {
      // Navigate to conversation if different from current
      console.log("Navigate to conversation:", notification.conversationId);
    }
  };

  // Toggle notifications modal - IMPROVED
  const toggleNotifications = async () => {
    if (!showNotifications && connection && currentUserId) {
      // Refresh notifications when opening modal
      try {
        await connection.invoke("GetNotifications", currentUserId);
        await connection.invoke("GetUnreadNotificationCount", currentUserId);
      } catch (error) {
        console.error("Error refreshing notifications:", error);
      }
    }
    setShowNotifications(!showNotifications);
  };

  // Clear all notifications - IMPROVED
  const clearAllNotifications = async () => {
    if (connection && currentUserId) {
      try {
        // Mark all notifications as read
        const unreadNotifications = notifications.filter(n => !n.isread);
        for (const notification of unreadNotifications) {
          await connection.invoke("MarkNotificationAsRead", notification.notificationid, currentUserId);
        }
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(n => ({ ...n, isread: true }))
        );
        setUnreadCount(0);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  // Format notification time - IMPROVED
  const formatNotificationTime = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return "vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  // Format notification content for display - NEW
  const formatNotificationContent = (notification) => {
    if (notification.notificationtype === 'message') {
      const senderName = notification.senderName || "Người dùng";
      return {
        title: `Tin nhắn mới từ ${senderName}`,
        content: notification.message,
        icon: "chatbubble"
      };
    }
    
    return {
      title: notification.title || "Thông báo",
      content: notification.message,
      icon: "notifications"
    };
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
    const isCurrentUser = (item.userid || item.Userid) === currentUserId;
    const messageText = item.message1 || item.message;
    const messageDate = item.creationdate
      ? new Date(item.creationdate)
      : new Date();
    const messageId = item.messageid || item.Messageid;
    const senderId = item.userid || item.Userid;
    const isSeen = item.isseen || item.Isseen;
    const senderName = item.fullname || "Unknown User";

    return (
      <TouchableOpacity
        // onLongPress={() => handleMessageLongPress(item)} // Đã tắt chức năng xóa tin nhắn
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.messageContainer,
            isCurrentUser
              ? styles.currentUserMessageContainer
              : styles.otherUserMessageContainer,
          ]}
        >
          {!isCurrentUser && (
            <View style={styles.messageAvatarContainer}>
              {item.avatar && item.avatar.trim() !== "" ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
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
                  <Ionicons name="person" size={20} color="#888" />
                </View>
              )}
            </View>
          )}
          
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
          >
            {/* Sender name for other users */}
            {!isCurrentUser && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}
            
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
            
            <View style={styles.messageFooter}>
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
              
              {/* Enhanced read status for current user messages */}
              {isCurrentUser && (
                <View style={styles.readStatusContainer}>
                  <View style={styles.seenStatus}>
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color={isSeen ? "#4CAF50" : "rgba(255, 255, 255, 0.6)"}
                    />
                  </View>
                  <Text style={[
                    styles.readStatusText,
                    { color: isSeen ? "#4CAF50" : "rgba(255, 255, 255, 0.6)" }
                  ]}>
                    {isSeen ? "Đã xem" : "Đã gửi"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    // Ensure messages is always an array
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log("🔍 groupMessagesByDate: No valid messages array, returning empty array");
      return [];
    }

    console.log("🔍 groupMessagesByDate: Processing", messages.length, "messages");
    
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

    console.log("🔍 groupMessagesByDate: Returning", groups.length, "items");
    return groups;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Chat Header */}
        <View style={styles.header}>
          <View style={styles.headerProfile}>
            {avatar && avatar.trim() !== "" ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
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
                <Ionicons name="person" size={24} color="#888" />
              </View>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>{name || "Chat"}</Text>
              <Text style={styles.headerStatus}>Đang kết nối...</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Notification Button */}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={toggleNotifications}
            >
              <Ionicons name="notifications" size={24} color="#333" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Menu Button */}
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B8DF6" />
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
          {avatar && avatar.trim() !== "" ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
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
              <Ionicons name="person" size={24} color="#888" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{name || "Chat"}</Text>
            {isTyping && typingUser ? (
              <Text style={styles.headerStatus}>💬 Đang nhập...</Text>
            ) : isOnline ? (
              <Text style={styles.headerStatus}>🟢 Online</Text>
            ) : lastSeen ? (
              <Text style={styles.headerStatus}>Hoạt động {formatTime(lastSeen)}</Text>
            ) : (
              <Text style={styles.headerStatus}>🔴 Offline</Text>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Notification Button */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleNotifications}
          >
            <Ionicons name="notifications" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Menu Button */}
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </TouchableOpacity>
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

        {/* Typing Indicator - ENHANCED */}
        {isTyping && typingUser && (
          <View style={styles.typingContainer}>
            <View style={styles.typingAvatarPlaceholder}>
              <Ionicons name="person" size={16} color="#ADB5BD" />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>
                {typingUser} đang nhập
              </Text>
              <TypingDots />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
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

        {/* Delete Message Modal - DISABLED */}
        {/* 
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            if (!selectedMessage?.isDeleting) {
              setShowDeleteModal(false);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="trash" size={32} color="#DC3545" />
              </View>
              
              <Text style={styles.modalTitle}>Xóa tin nhắn</Text>
              <Text style={styles.modalMessage}>
                Bạn có chắc chắn muốn xóa tin nhắn này không?{'\n'}
                <Text style={styles.modalSubMessage}>
                  Tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.
                </Text>
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={selectedMessage?.isDeleting}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.deleteButton,
                    selectedMessage?.isDeleting && styles.deleteButtonDisabled
                  ]}
                  onPress={() => {
                    const messageId = selectedMessage?.messageid || selectedMessage?.Messageid;
                    if (messageId && !selectedMessage?.isDeleting) {
                      handleDeleteMessage(messageId);
                    }
                  }}
                  disabled={selectedMessage?.isDeleting}
                >
                  {selectedMessage?.isDeleting ? (
                    <View style={styles.deleteButtonLoading}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Đang xóa...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Xóa</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        */}

        {/* Notifications Modal */}
        <Modal
          visible={showNotifications}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.notificationModalOverlay}>
            <View style={styles.notificationModalContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>Thông báo</Text>
                <View style={styles.notificationHeaderActions}>
                  {notifications.length > 0 && (
                    <TouchableOpacity 
                      onPress={clearAllNotifications}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => setShowNotifications(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              <FlatList
                data={notifications}
                keyExtractor={(item) => item.notificationid}
                renderItem={({ item }) => {
                  const formattedContent = formatNotificationContent(item);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.notificationItem,
                        !item.isread && styles.unreadNotificationItem
                      ]}
                      onPress={() => handleNotificationPress(item)}
                    >
                      <View style={styles.notificationIcon}>
                        <Ionicons 
                          name={formattedContent.icon} 
                          size={24} 
                          color={item.notificationtype === 'message' ? "#63B35C" : "#5B8DF6"} 
                        />
                      </View>
                      
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationItemTitle}>
                            {formattedContent.title}
                          </Text>
                          {!item.isread && (
                            <View style={styles.unreadIndicator} />
                          )}
                        </View>
                        
                        <Text 
                          style={styles.notificationItemMessage}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {formattedContent.content}
                        </Text>
                        
                        <View style={styles.notificationFooter}>
                          <Text style={styles.notificationItemTime}>
                            {formatNotificationTime(item.createdat)}
                          </Text>
                          
                          {item.notificationtype === 'message' && (
                            <View style={styles.messageNotificationBadge}>
                              <Ionicons name="chatbubble" size={12} color="#FFFFFF" />
                              <Text style={styles.messageNotificationBadgeText}>Tin nhắn</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off" size={48} color="#ccc" />
                    <Text style={styles.emptyNotificationsText}>
                      Không có thông báo nào
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    justifyContent: "center",
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 13,
    color: "#28A745",
    fontWeight: "500",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "flex-end",
    maxWidth: "100%",
  },
  currentUserMessageContainer: {
    justifyContent: "flex-end",
    paddingLeft: 50,
  },
  otherUserMessageContainer: {
    justifyContent: "flex-start",
    paddingRight: 50,
  },
  messageAvatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserBubble: {
    backgroundColor: "#28A745",
    borderBottomRightRadius: 6,
    marginLeft: "auto",
  },
  otherUserBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  currentUserMessageText: {
    color: "#FFFFFF",
  },
  otherUserMessageText: {
    color: "#212529",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  currentUserTimeText: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  otherUserTimeText: {
    color: "#6C757D",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputIcons: {
    flexDirection: "row",
    marginRight: 10,
  },
  iconButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 50,
    backgroundColor: "#F8F9FA",
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    fontWeight: "400",
    color: "#212529",
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DEE2E6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonActive: {
    backgroundColor: "#28A745",
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 24,
  },
  dateSeparatorText: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    color: "#6C757D",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
  },
  seenStatus: {
    marginLeft: 6,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  typingAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9ECEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    maxWidth: "80%",
  },
  typingText: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
    marginRight: 8,
    fontStyle: "italic",
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#28A745",
    marginHorizontal: 3,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 4,
    marginLeft: 2,
  },
  readStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  readStatusText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC3545",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIcon: {
    marginBottom: 12,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalSubMessage: {
    fontSize: 14,
    color: "#ADB5BD",
    fontWeight: "400",
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelButton: {
    backgroundColor: "#F8F9FA",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6C757D",
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  deleteButtonDisabled: {
    backgroundColor: "#ADB5BD",
    opacity: 0.6,
  },
  deleteButtonLoading: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  notificationModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notificationModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  notificationHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28A745",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadNotificationItem: {
    backgroundColor: "#F8FFF8",
    borderLeftWidth: 4,
    borderLeftColor: "#28A745",
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
    lineHeight: 20,
  },
  notificationItemMessage: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationItemTime: {
    fontSize: 12,
    color: "#ADB5BD",
    fontWeight: "500",
  },
  messageNotificationBadge: {
    backgroundColor: "#28A745",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  messageNotificationBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#28A745",
    marginLeft: 8,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: "#ADB5BD",
    fontWeight: "500",
    marginTop: 12,
  },
});

export default ChatScreen;
