import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

const MAX_CAPACITY = 4; 

export default function HomeScreen() {
  const [airport, setAirport] = useState("");
  const [time, setTime] = useState("");
  const [terminal, setTerminal] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState("");
  const [fullName, setFullName] = useState("User");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showHomeContent, setShowHomeContent] = useState(false);

  const airports = ["LAX", "BUR", "LGB", "SNA", "HHR"];
  const times = Array.from({ length: 48 }).map((_, index) => {
    const totalMinutes = index * 30;
    const hours = Math.floor(totalMinutes / 60) % 12 || 12;
    const minutes = totalMinutes % 60;
    const period = totalMinutes < 720 ? "AM" : "PM";
    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }
      if (user?.id) setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }
      if (profile && profile.full_name) setFullName(profile.full_name);
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const checkActiveGroup = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          // Check if user has an active car group
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('active_car_id')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          if (profile?.active_car_id) {
            // Redirect to messaging if user has an active group
            router.replace({
              pathname: '/messaging',
              params: { carId: profile.active_car_id }
            });
          } else {
            // Only show home content if there's no active group
            setShowHomeContent(true);
          }
        }
      } catch (error) {
        console.error('Error checking active group:', error);
        setShowHomeContent(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveGroup();
  }, []);

  // CHANGED: Added validation and parsing for `time`
  const parseTime = (timeString: string): Date | null => {
    const [timePart, period] = timeString.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);

    if (isNaN(hours) || isNaN(minutes)) return null;

    const adjustedHours = period === "PM" && hours !== 12
      ? hours + 12
      : period === "AM" && hours === 12
      ? 0
      : hours;

    const currentDate = new Date();
    currentDate.setHours(adjustedHours, minutes, 0, 0);
    return currentDate;
  };

  const handleFindGroups = async () => {
    if (!airport || !time || !terminal) {
      Alert.alert("Error", "Please select all fields (airport, time, terminal).");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User is not logged in.");
      return;
    }

    // CHANGED: Validate and parse the selected time
    const parsedTime = parseTime(time);
    if (!parsedTime) {
      Alert.alert("Error", "Invalid time selected.");
      return;
    }

    try {
      // Insert airport and terminal, and generate cars
      const { airportId, terminalId } = await ensureAirportAndTerminal(airport, terminal);
      await generateCars(airportId, terminalId, parsedTime.getTime());

      // Navigate to groups screen
      router.push({
        pathname: "/groups",
        params: {
          selectedTime: parsedTime.toISOString(), // Pass the parsed ISO time
          airportId, // Ensure airportId is passed
          terminalId, // Ensure terminalId is passed
        },
      });
    } catch (error) {
      console.error("Error finding groups:", error);
      Alert.alert("Error", "Failed to find groups. Please try again.");
    }
  };

  const ensureAirportAndTerminal = async (airport: string, terminal: string) => {
    try {
      const { data: airportData, error: airportError } = await supabase
        .from("airports")
        .select("id")
        .eq("name", airport);
      let airportId;
      if (airportData && airportData.length === 1) {
        airportId = airportData[0].id;
      } else if (airportData.length === 0) {
        const { data: newAirport, error: newAirportError } = await supabase
          .from("airports")
          .insert({ name: airport })
          .select("id");
        if (newAirportError) throw new Error("Failed to insert new airport.");
        airportId = newAirport[0].id;
      } else {
        throw new Error("Multiple airports found with the same name.");
      }

      const { data: terminalData, error: terminalError } = await supabase
        .from("terminals")
        .select("id")
        .eq("name", terminal)
        .eq("airport_id", airportId);
      let terminalId;
      if (terminalData && terminalData.length === 1) {
        terminalId = terminalData[0].id;
      } else if (terminalData.length === 0) {
        const { data: newTerminal, error: newTerminalError } = await supabase
          .from("terminals")
          .insert({ name: terminal, airport_id: airportId })
          .select("id");
        if (newTerminalError) throw new Error("Failed to insert new terminal.");
        terminalId = newTerminal[0].id;
      } else {
        throw new Error("Multiple terminals found with the same name and airport ID.");
      }
      return { airportId, terminalId };
    } catch (error) {
      throw error;
    }
  };

  const generateCars = async (airportId: string, terminalId: string, baseTime: number) => {
    try {
      // Define the time intervals for car groups
      const times = [
        baseTime - 60 * 60 * 1000, // 1 hour before
        baseTime - 30 * 60 * 1000, // 30 minutes before
        baseTime,                  // Exact time
        baseTime + 30 * 60 * 1000, // 30 minutes after
        baseTime + 60 * 60 * 1000, // 1 hour after
      ];
  
      // Fetch existing car groups for the same airport and terminal
      const { data: existingCars, error: fetchError } = await supabase
        .from("cars")
        .select("id, departure_time, user_ids")
        .eq("airport_id", airportId)
        .eq("terminal_id", terminalId)
        .in(
          "departure_time",
          times.map((time) => new Date(time).toISOString())
        );
  
      if (fetchError) throw fetchError;
  
      // Filter out times that already exist in the database
      const existingTimes = new Set(
        (existingCars || []).map((car) => new Date(car.departure_time).getTime())
      );
  
      const newTimes = times.filter((time) => !existingTimes.has(time));
  
      // Create new car groups only for times that don't exist
      if (newTimes.length > 0) {
        const newCars = newTimes.map((time) => ({
          departure_time: new Date(time).toISOString(),
          user_ids: [],
          max_capacity: MAX_CAPACITY,
          airport_id: airportId,
          terminal_id: terminalId,
        }));
  
        const { error: insertError } = await supabase.from("cars").insert(newCars);
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error generating cars:", error);
      throw error;
    }
  };

  const handleSelectValue = (value: string) => {
    if (currentPicker === "airport") setAirport(value);
    if (currentPicker === "time") setTime(value);
    setModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!showHomeContent) {
    return null; // Return empty screen while redirecting
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={100}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Hello, {fullName}</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => {
              setCurrentPicker("airport");
              setModalVisible(true);
            }}
          >
            <Text style={styles.dropdownText}>{airport || "Select Airport"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => {
              setCurrentPicker("time");
              setModalVisible(true);
            }}
          >
            <Text style={styles.dropdownText}>{time || "Select Time"}</Text>
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter Terminal"
              value={terminal}
              onChangeText={setTerminal}
              style={styles.input}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleFindGroups}>
            <Text style={styles.buttonText}>Find Groups</Text>
          </TouchableOpacity>
          <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <FlatList
                  data={currentPicker === "airport" ? airports : times}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectValue(item)}>
                      <Text style={styles.modalText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  dropdownContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  input: {
    height: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "70%",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 10,
    alignItems: "center",
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 5,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "bold",
  },
});