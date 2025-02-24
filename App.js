import React from "react";
import Layout from "./layout/layout.jsx";
import { PaperProvider } from "react-native-paper";

export default function App() {
  return (
    <PaperProvider>
      <Layout />
    </PaperProvider>
  );
}
