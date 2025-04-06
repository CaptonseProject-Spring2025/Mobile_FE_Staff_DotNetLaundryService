import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import PickupList from "./pickupList";
const PickupScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff",}}>
      <TextInput
        placeholder="Tìm kiếm đơn hàng"
        mode="outlined"
        onChangeText={setSearchQuery}
        value={searchQuery}
        left={<TextInput.Icon icon="magnify" />}
        style={{ backgroundColor: "#E9EAEB", margin: 20 }}
        theme={{ colors: { primary: "#E9EAEB", outline: "#E9EAEB" } }}
        outlineColor="#E9EAEB"
      />
      <PickupList searchQuery={searchQuery} />
    </View>
  );
};

const styles = StyleSheet.create({});

export default PickupScreen;
