import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const padding = 20; // Add a padding value

export default function Joining() {
  const router = useRouter();
  const { carId } = useLocalSearchParams<{ carId: string }>();

  useEffect(() => {
    // Redirect after 2 seconds to the messaging page
    const timeout = setTimeout(() => {
      router.push({
        pathname: "../messaging",
        params: { carId }, // Pass carId to the messaging page
      });
    }, 2000);

    // Cleanup the timeout when component unmounts
    return () => clearTimeout(timeout);
  }, [router, carId]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/car.png")}
        style={styles.icon}
      />
      <Text style={styles.text}>hold tight, adding you to your group...</Text>
      {/* Loading spinner */}
      <ActivityIndicator size="large" color="#ccc" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: screenWidth - 2 * padding < 200 ? screenWidth / 10 : 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: padding,
    alignSelf: "center",
  },
  spinner: {
    marginTop: 20,
  },
});