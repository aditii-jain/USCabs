import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

const MAX_CAPACITY = 4;

export default function Groups() {
  const router = useRouter();
  const { selectedTime, airportId, terminalId } = useLocalSearchParams(); // Use `useLocalSearchParams`
  const [groups, setGroups] = useState<
    { id: string; departure_time: string; user_ids: string[] }[]
  >([]);

  useEffect(() => {
    const fetchFilteredGroups = async () => {
        try {
          const baseTimestamp = new Date(selectedTime as string).getTime();
      
          const { data: cars, error } = await supabase
            .from("cars")
            .select("id, departure_time, user_ids")
            .eq("airport_id", airportId)
            .eq("terminal_id", terminalId)
            .gte(
              "departure_time",
              new Date(baseTimestamp - 60 * 60 * 1000).toISOString() // 1 hour before
            )
            .lte(
              "departure_time",
              new Date(baseTimestamp + 60 * 60 * 1000).toISOString() // 1 hour after
            );
      
          if (error) throw error;
          setGroups(cars || []);
        } catch (error) {
          console.error("Error fetching filtered groups:", error);
        }
      };

    if (selectedTime && airportId && terminalId) {
      fetchFilteredGroups();
    } else {
      Alert.alert("Error", "Missing required information to load groups.");
      router.replace("/home"); // Redirect to home if necessary info is missing
    }
  }, [selectedTime, airportId, terminalId]);

  const handleGroupSelect = async (groupId: string) => {
    try {
      // Fetch the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Unable to fetch the logged-in user.");
        return;
      }
  
      // Append the user ID to the `user_ids` array for the selected car group
      const { error } = await supabase.rpc("append_user_to_group", {
        car_id: groupId,
        user_id: user.id,
      });
  
      if (error) {
        console.error("Error adding user to group:", error);
        Alert.alert("Error", "Failed to join the group. Please try again.");
        return;
      }
  
      // Redirect to the joining page and pass the carId
      router.push({
        pathname: "/redirecting/joining",
        params: { carId: groupId }, // Pass carId as a query parameter
      });
    } catch (error) {
      console.error("Error handling group selection:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const renderGroupCard = (group: any) => {
    const time = new Date(group.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <TouchableOpacity key={group.id} style={styles.groupCard} onPress={() => handleGroupSelect(group.id)}>
        <View style={styles.groupInfo}>
          <View style={styles.row}>
            <Image source={require("../assets/images/clock.png")} style={styles.icon} />
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <View style={styles.row}>
            <Image source={require("../assets/images/location.png")} style={styles.icon} />
            <Text style={styles.locationText}>USC Village</Text>
          </View>
        </View>
        <View style={styles.groupCapacity}>
          <Text style={styles.capacityText}>
            {group.user_ids.length}/{MAX_CAPACITY}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>Which group would you like to depart with?</Text>
      {groups.length === 0 ? (
        <Text style={styles.noGroupsText}>No groups available.</Text>
      ) : (
        groups.map(renderGroupCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  groupCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  groupInfo: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  locationText: {
    fontSize: 16,
    color: "#555",
  },
  groupCapacity: {
    flexDirection: "row",
    alignItems: "center",
  },
  capacityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noGroupsText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
});