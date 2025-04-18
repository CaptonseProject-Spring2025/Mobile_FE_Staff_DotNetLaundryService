import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";

const PayosWebView = ({ navigation, route }) => {
  const { checkoutUrl, returnToScreen, assignmentId } = route.params;
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState) => {
    // Check if the URL contains success indicators
    if (navState.url.includes("status=PAID")) {
      Toast.show({
        type: "success",
        text1: "Thanh toán thành công",
        text2: "Giao dịch hoàn thành",
      });
      if (returnToScreen === "OrderDetail") {
        navigation.navigate("DriverHome", {
          screen: "Trang chủ",
          params: {
            screen: "DriverDeliveryOrderDetailScreen",
            params: {
              assignmentId: assignmentId,
              paymentSuccess: true,
            },
          },
        });
      } else {
        navigation.goBack();
      }
    }

    // Check if the URL contains cancellation indicators
    if (navState.url.includes("status=CANCELLED")) {
      Toast.show({
        type: "info",
        text1: "Thanh toán đã bị hủy",
        text2: "Giao dịch không được hoàn thành",
      });
      if (returnToScreen === "OrderDetail") {
        navigation.navigate("DriverHome", {
          screen: "Trang chủ",
          params: {
            screen: "DriverDeliveryOrderDetailScreen",
            params: {
              assignmentId: assignmentId,
              paymentSuccess: false,
            },
          },
        });
      } else {
        navigation.goBack();
      }
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#02A257" />
          <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
        </View>
      )}

      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationStateChange}
        onLoad={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    marginTop: StatusBar.currentHeight || 0,
    marginBottom: 10,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#02A257",
  },
});

export default PayosWebView;
