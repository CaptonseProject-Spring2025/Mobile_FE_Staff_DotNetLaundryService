import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, Image, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import useCheckOrderStore from "../../../api/store/checkOrderStore";
import useUserStore from "../../../api/store/userStore";
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function OrderWashedListScreen({ navigation }) {
  const {
    orderWashed,
    isLoadingOrderWashed,
    orderWashedError,
    fetchOrderWashed,
    fetchOrderHistory,
    orderHistory,
    fetchOrderStatusPhotos,
    orderStatusPhotos
  } = useCheckOrderStore();
  const { getUserById } = useUserStore();
  const [customerDetails, setCustomerDetails] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedStatusHistoryId, setSelectedStatusHistoryId] = useState(null);

  // Gọi API khi màn hình được mount
  useEffect(() => {
    fetchOrderWashed();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchOrderWashed(); // Gọi lại API khi màn hình được focus
    });
  
    return unsubscribe; // Hủy đăng ký sự kiện khi component bị unmount
  }, [navigation]);

  useEffect(() => {
    // Lấy thông tin chi tiết của tất cả khách hàng trong danh sách đơn hàng
    const fetchCustomerDetails = async () => {
      const details = {};
      if (orderWashed && orderWashed.length > 0) {
        for (const order of orderWashed) {
          if (order.customerInfo && order.customerInfo.customerId) {
            // Kiểm tra xem đã lấy thông tin của khách hàng này chưa
            if (!details[order.customerInfo.customerId]) {
              const customerData = await getUserById(order.customerInfo.customerId);
              if (customerData) {
                details[order.customerInfo.customerId] = customerData;
              }
            }
          }
        }
        setCustomerDetails(details);
      }
    };
    
    fetchCustomerDetails();
  }, [orderWashed]);

  const handleImageError = (customerId) => {
    setImageErrors(prev => ({
      ...prev,
      [customerId]: true
    }));
  };

  const toggleCustomerDetails = (customerId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  // const handleChatPress = (customerId, customerName) => {
  //   navigation.navigate('ChatScreen', {
  //     customerId,
  //     customerName
  //   });
  // };

  // Hàm chuyển đổi trạng thái thành màu sắc
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-gray-500';
      case 'Suspended': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // Hàm chuyển đổi giới tính thành icon
  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'Male': return 'male';
      case 'Female': return 'female';
      default: return 'help-circle';
    }
  };

  const showOrderHistory = async (orderId) => {
    setSelectedOrderId(orderId);
    try {
      const history = await fetchOrderHistory(orderId);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching order history:", error);
      Alert.alert("Lỗi", "Không thể lấy lịch sử đơn hàng. Vui lòng thử lại sau.");
    }
  };

  const showStatusPhotos = async (statusHistoryId) => {
    setSelectedStatusHistoryId(statusHistoryId);
    try {
      console.log("Fetching photos for status history ID:", statusHistoryId);
      const photos = await fetchOrderStatusPhotos(statusHistoryId);
      console.log("Photos received:", photos);
      
      if (photos && photos.length > 0) {
        console.log("Opening photo modal with", photos.length, "photos");
        setPhotoModalVisible(true);
      } else {
        console.log("No photos found");
        Alert.alert("Thông báo", "Không tìm thấy hình ảnh đính kèm cho trạng thái này.");
      }
    } catch (error) {
      console.error("Error fetching status photos:", error);
      Alert.alert("Lỗi", "Không thể lấy hình ảnh đính kèm. Vui lòng thử lại sau.");
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-700';
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'SCHEDULED_PICKUP': return 'bg-indigo-100 text-indigo-700';
      case 'PICKINGUP': return 'bg-purple-100 text-purple-700';
      case 'PICKEDUP': return 'bg-amber-100 text-amber-700';
      case 'PICKUP_SUCCESS': return 'bg-emerald-100 text-emerald-700';
      case 'WASHED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderOrderItem = ({ item }) => {
    const customerDetail = customerDetails[item.customerInfo.customerId];
    const hasImageError = imageErrors[item.customerInfo.customerId];
    const isExpanded = expandedCustomers[item.customerInfo.customerId];
    
    return (
      <TouchableOpacity
        className="bg-white rounded-xl shadow-sm mb-4 p-4"
        onPress={() =>
          navigation.navigate("OrderDetailWashedScreen", {
            orderId: item.orderId,
            orderDetail: item,
          })
        }
      >
        {/* Order Header */}
        <View className="px-3 py-2">
          {/* Order Code line */}
          <View className="bg-green-50 px-2 py-1 rounded-full self-start mb-1">
            <Text className="text-green-600 font-medium">
              Mã đơn: {item.orderId}
            </Text>
          </View>
          
          {/* Buttons line */}
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => showOrderHistory(item.orderId)}
              className="bg-indigo-100 px-3 py-1 rounded-full mr-2"
            >
              <Text className="text-indigo-700 font-medium text-xs">
                Lịch sử
              </Text>
            </TouchableOpacity>
            
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-700 font-medium text-xs">
                {item.currentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <TouchableOpacity 
          onPress={() => toggleCustomerDetails(item.customerInfo.customerId)}
          className="bg-gray-50 rounded-lg p-3 mb-3"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {customerDetail && customerDetail.avatar && !hasImageError ? (
                <Image 
                  source={{ uri: customerDetail.avatar }} 
                  className="w-10 h-10 rounded-full"
                  onError={() => handleImageError(item.customerInfo.customerId)}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={24} color="#4B5563" />
              )}
              <View className="ml-2">
                <Text className="text-gray-800 font-medium text-base">
                  {item.customerInfo.customerName}
                </Text>
                <Text className="text-gray-600">
                  {item.customerInfo.customerPhone}
                </Text>
                {customerDetail && (
                  <>
                    {customerDetail.email && (
                      <Text className="text-gray-500 text-xs">
                        {customerDetail.email}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text className="text-gray-500 text-xs ml-1">
                        Điểm thưởng: {customerDetail.rewardPoints || 0}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View className="flex-row items-center">
              {/* <TouchableOpacity 
                onPress={() => handleChatPress(item.customerInfo.customerId, item.customerInfo.customerName)}
                className="bg-blue-500 rounded-full p-2 mr-2"
              >
                <Ionicons name="chatbubble-outline" size={20} color="white" />
              </TouchableOpacity> */}
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#4B5563" 
              />
            </View>
          </View>

          {/* Thêm thông tin chi tiết khách hàng khi mở rộng */}
          {isExpanded && customerDetail && (
            <View className="mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name={getGenderIcon(customerDetail.gender)} size={16} color="#4B5563" />
                  <Text className="text-gray-700 text-xs ml-1">
                    {customerDetail.gender || 'Chưa có thông tin'}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={16} color="#4B5563" />
                  <Text className="text-gray-700 text-xs ml-1">
                    {customerDetail.dob ? format(new Date(customerDetail.dob), 'dd/MM/yyyy', { locale: vi }) : 'Chưa có thông tin'}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className={`w-2 h-2 rounded-full ${getStatusColor(customerDetail.status)} mr-1`} />
                  <Text className="text-gray-700 text-xs">
                    {customerDetail.status || 'Chưa có thông tin'}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#4B5563" />
                  <Text className="text-gray-700 text-xs ml-1">
                    Tham gia: {customerDetail.dateCreated ? format(new Date(customerDetail.dateCreated), 'dd/MM/yyyy', { locale: vi }) : 'Chưa có thông tin'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Service Info */}
        <View className="mb-3">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shirt-outline" size={20} color="#4B5563" />
            <Text className="text-gray-800 ml-2">{item.serviceNames}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={20} color="#4B5563" />
            <Text className="text-gray-800 ml-2">Số lượng: {item.serviceCount}</Text>
          </View>
        </View>

        {/* Time Info */}
        <View className="bg-gray-50 rounded-lg p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={18} color="#4B5563" />
            <Text className="text-gray-600 ml-2">
              Ngày đặt: {format(new Date(item.orderDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Ionicons name="time-outline" size={18} color="#4B5563" />
            <Text className="text-gray-600 ml-2">
              Thời gian lấy: {format(new Date(item.pickupTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={18} color="#4B5563" />
            <Text className="text-gray-600 ml-2">
              Thời gian giao: {format(new Date(item.deliveryTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </Text>
          </View>
        </View>

        {/* Price */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500">Tổng tiền</Text>
            <Text className="text-red-500 font-bold text-lg">
              {item.totalPrice.toLocaleString()} VND
            </Text>
          </View>
        </View>

        {/* Emergency Badge */}
        {item.emergency && (
          <View className="absolute top-2 right-2">
            <View className="bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs">Khẩn cấp</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoadingOrderWashed) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-lg text-gray-500 mt-4">Đang tải...</Text>
      </View>
    );
  }

  if (orderWashedError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-lg text-red-500">Lỗi: {orderWashedError}</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => fetchOrderWashed()}
        >
          <Text className="text-white font-medium">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-white py-4 px-4 shadow-sm">
        <Text className="text-xl font-bold text-gray-800">
          Danh sách đơn hàng đã giặt xong
        </Text>
      </View>
      
      <FlatList
        data={orderWashed}
        renderItem={renderOrderItem}
        keyExtractor={item => item.orderId}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Order History Bottom Sheet */}
      {historyModalVisible && (
        <View 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg" 
          style={{ height: '80%' }}
        >
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">
                Lịch sử đơn hàng {selectedOrderId}
              </Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={orderHistory || []}
            keyExtractor={(item, index) => item.statusHistoryId || index.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <Ionicons name="hourglass-outline" size={48} color="#D1D5DB" />
                <Text className="text-center text-gray-500 mt-4 text-base">
                  Đang tải lịch sử đơn hàng...
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View className="mb-4 border-l-2 border-gray-300 pl-4 relative">
                {/* Status dot */}
                <View className="absolute -left-[6px] top-0 w-3 h-3 rounded-full bg-gray-500" />
                
                {/* Status header */}
                <View className="flex-row items-center mb-1">
                  <View className={`px-2 py-1 rounded-full ${getStatusColorClass(item.status).split(' ')[0]}`}>
                    <Text className={`font-medium text-xs ${getStatusColorClass(item.status).split(' ')[1]}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-gray-800 font-medium mb-1">
                  {item.statusDescription}
                </Text>
                
                {item.notes && (
                  <Text className="text-gray-600 mb-1">
                    Ghi chú: {item.notes}
                  </Text>
                )}
                
                {/* User info */}
                {item.updatedBy && (
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="person-outline" size={14} color="#4B5563" />
                    <Text className="text-gray-600 text-xs ml-1">
                      Cập nhật bởi: {item.updatedBy.fullName} ({item.updatedBy.phoneNumber})
                    </Text>
                  </View>
                )}
                
                {/* Timestamp */}
                {item.createdAt && (
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#4B5563" />
                    <Text className="text-gray-500 text-xs ml-1">
                      {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </Text>
                  </View>
                )}
                
                {item.containMedia && (
                  <TouchableOpacity 
                    className="mt-2 bg-indigo-50 p-2 rounded-lg"
                    onPress={() => showStatusPhotos(item.statusHistoryId)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="image-outline" size={16} color="#4F46E5" />
                      <Text className="text-indigo-700 text-xs ml-1">
                        Xem hình ảnh đính kèm
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      )}
      
      {/* Photos Modal */}
      {photoModalVisible && (
        <View className="absolute inset-0 bg-black/80 z-50">
          <View className="bg-white rounded-t-3xl h-5/6 mt-auto">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold text-gray-800">
                  Hình ảnh đính kèm
                </Text>
                <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={orderStatusPhotos || []}
              keyExtractor={(item, index) => item.photoUrl || index.toString()}
              numColumns={2}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-12">
                  <Ionicons name="images-outline" size={48} color="#D1D5DB" />
                  <Text className="text-center text-gray-500 mt-4">
                    Không có hình ảnh
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View className="p-1 w-1/2">
                  <Image
                    source={{ uri: item.photoUrl }}
                    className="w-full h-40 rounded-lg"
                    resizeMode="cover"
                    onError={() => console.error("Error loading image:", item.photoUrl)}
                  />
                  {item.createdAt && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export default OrderWashedListScreen;