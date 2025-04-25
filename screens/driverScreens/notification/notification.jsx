import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import NotificationList from "./notificationList";

export default function Notification() {
  return (
    <SafeAreaView style={styles.container}>
      <NotificationList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
