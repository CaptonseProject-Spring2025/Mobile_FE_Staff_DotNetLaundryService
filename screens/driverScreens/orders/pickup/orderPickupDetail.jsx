import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Divider, Avatar } from "react-native-paper";
import MapboxGL from "@rnmapbox/maps";
import useOrderStore from "../../../../api/store/orderStore";
import Toast from "react-native-toast-message";

const OrderPickupDetail = ({ navigation, route }) => {
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const { assignmentId } = route.params;
  const {
    cancelPickUp,
    isLoadingCancelPickUp,
    cancelPickUpError,
    fetchOrderDetail,
    isLoadingOrderDetail,
    orderDetail,
    fetchAssignmentDetail,
    assignmentDetail,
    isLoadingAssignmentDetail,
  } = useOrderStore();

  useEffect(() => {
    const fetchData = async () => {
      if (assignmentId) {
        try {
          setDataLoaded(false);
          await fetchAssignmentDetail(assignmentId);
        } catch (error) {
          console.error("Error fetching assignment details:", error);
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể tải thông tin đơn hàng',
          });
        }
      }
    };
    fetchData();
  }, [assignmentId]);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (assignmentDetail && assignmentDetail.orderId) {
        try {
          await fetchOrderDetail(assignmentDetail.orderId);
          setDataLoaded(true);
        } catch (error) {
          console.error("Error fetching order details:", error);
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể tải chi tiết đơn hàng',
          });
          setDataLoaded(true);
        }
      }
    };
    fetchOrderData();
  }, [assignmentDetail]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay  */}
      {(isLoadingOrderDetail || isLoadingAssignmentDetail) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#02A257" />
          <Text style={styles.loadingText}>
            {isLoadingAssignmentDetail 
              ? "Đang tải thông tin đơn hàng..." 
              : isLoadingOrderDetail 
                ? "Đang tải chi tiết đơn hàng..." 
                : "Đang tải dữ liệu..."}
          </Text>
        </View>
      )}

      {/* Cancel Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do hủy đơn hàng"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline={true}
              numberOfLines={4}
              mode="outlined"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setCancelReason("");
                }}
              >
                <Text style={styles.buttonCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonConfirm]}
                onPress={() => {
                  console.log("Order canceled with reason:", cancelReason);
                  setCancelModalVisible(false);
                }}
              >
                <Text style={styles.buttonConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        style={{ marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order ID section */}
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Mã đơn hàng</Text>
          <Text style={styles.orderValue}>
            {orderDetail.orderId ? orderDetail.orderId.split("-").pop() : "N/A"}
          </Text>
        </View>
        <View style={styles.sectionDivider} />
        {/* Order summary section */}
        <View>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
            Tóm tắt đơn hàng
          </Text>
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.orderSummaryContainer}>
            {/* Map through cart items */}
            {orderDetail?.orderSummary?.items?.length > 0 ? (
              orderDetail.orderSummary.items.map((item, index) => (
                <View key={index} style={styles.orderRow}>
                  <View style={{ flexDirection: "column", gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 14 }}>
                      {item.quantity}x {item.serviceName} (
                      {item.servicePrice
                        ? `${item.servicePrice.toLocaleString()}đ`
                        : ""}
                      )
                    </Text>

                    {/* Show extras if they exist */}
                    {item.extras && item.extras.length > 0 && (
                      <View style={{ marginLeft: 15 }}>
                        {item.extras.map((extra, extraIndex) => (
                          <Text
                            key={`${index}-${extraIndex}`}
                            style={{ fontSize: 14, color: "#666" }}
                          >
                            + {item.quantity}x {extra.extraName} (
                            {(
                              extra.extraPrice * item.quantity
                            ).toLocaleString()}
                            đ )
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "500" }}>
                    {item.subTotal?.toLocaleString()}đ
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", padding: 15, color: "#666" }}>
                Chưa có dịch vụ nào trong giỏ hàng
              </Text>
            )}
            {/* Subtotal */}
            <View style={[styles.orderRow, { marginTop: 15 }]}>
              <Text style={{ fontSize: 16 }}>Tổng tạm tính dịch vụ</Text>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.estimatedTotal?.toLocaleString()}đ
              </Text>
            </View>

            {/* Shipping Fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Phí ship</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.shippingFee?.toLocaleString()}đ
              </Text>
            </View>

            {/*additional fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Phí áp dụng</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.applicableFee?.toLocaleString()}đ
              </Text>
            </View>

            <Divider style={{ marginVertical: 10 }} />
            {/* Total Fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Tổng</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.totalPrice?.toLocaleString()}đ
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionDivider} />
        {/* Location section */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
            }}
          >
            <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddressNavigateMap", {
                  userData: {
                    pickupLongitude: orderDetail.pickupLongitude,
                    pickupLatitude: orderDetail.pickupLatitude,
                    pickupName: orderDetail.pickupName,
                    pickupPhone: orderDetail.pickupPhone,
                    pickupAddressDetail: orderDetail.pickupAddressDetail
                  },
                  showTravelingArrow: true,
                })
              }
            >
              <Text style={{ color: "#63B35C" }}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.addressContainer, { paddingHorizontal: 20 }]}>
            <MapboxGL.MapView
              style={styles.map}
              compassEnabled={false}
              zoomEnabled={false}
              scrollEnabled={false}
              rotateEnabled={false}
              logoEnabled={false}
              scaleBarEnabled={false}
            >
              {orderDetail?.pickupLatitude && orderDetail?.pickupLongitude && (
                <>
                  <MapboxGL.Camera
                    zoomLevel={15}
                    centerCoordinate={[
                      orderDetail.pickupLongitude,
                      orderDetail.pickupLatitude,
                    ]}
                  />
                  <MapboxGL.PointAnnotation
                    id="pickupLocation"
                    coordinate={[
                      orderDetail.pickupLongitude,
                      orderDetail.pickupLatitude,
                    ]}
                  />
                </>
              )}
            </MapboxGL.MapView>
            <View
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                gap: 10,
              }}
            >
              {orderDetail ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>
                    {orderDetail.pickupName} - {orderDetail.pickupPhone}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      flexShrink: 1,
                      maxWidth: "80%",
                    }}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {orderDetail.pickupAddressDetail}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 14 }}>Không tìm thấy địa chỉ </Text>
                  <Text style={{ fontSize: 11 }}>Vui lòng thêm địa chỉ</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />
        {/* Notes Section */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <View style={{ marginTop: 10 }}>
            <TextInput
              mode="flat"
              style={{ backgroundColor: "white" }}
              theme={{ colors: { primary: "gray" } }}
              multiline={true}
              numberOfLines={5}
              dense={true}
              value={assignmentDetail?.note || "N/A"}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.sectionDivider} />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setCancelModalVisible(true)}
        >
          <Text style={styles.cancelButtonText}>Hủy đơn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={() => console.log("Complete order")}
        >
          <Text style={styles.completeButtonText}>Hoàn thành đơn</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#02A257",
    fontWeight: "500",
  },
  sectionDivider: {
    height: 10,
    backgroundColor: "#f5f5f5",
    width: "100%",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: "green",
    marginBottom: 10,
  },
  addressContainer: {
    borderRadius: 5,
    flexDirection: "row",
    gap: 20,
    padding: 10,
  },
  map: {
    width: 80,
    height: 80,
  },
  serviceName: {
    fontSize: 10,
    textAlign: "center",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  orderLabel: {
    fontWeight: "bold",
    fontSize: 20,
  },
  orderValue: {
    fontWeight: "bold",
    fontSize: 18,
  },
  orderSummaryContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentOptionNew: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#e0e0e0",
    backgroundColor: "white",
    height: 80,
    width: "50%",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentContainer: {
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    flexDirection: "row",
    gap: 1,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f8f8f8",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  completeButton: {
    backgroundColor: "#02A257",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    width: 250,
    height: 100,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: "45%",
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#f8f8f8",
  },
  buttonConfirm: {
    backgroundColor: "#02A257",
  },
  buttonCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  buttonConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default OrderPickupDetail;
