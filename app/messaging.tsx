// app/messaging.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import MessageBubble from "../components/MessageBubble";
import { Message } from "../types/database"; // Import your interface
import { router } from 'expo-router';

export default function Messaging() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const [messages, setMessages] = useState<Message[]>([]); // Use the imported type
  const [newMessage, setNewMessage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch user ID
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      setUserId(user?.id || null);
    };

    fetchUser();
  }, []);

  // Fetch messages for the car group
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("car_id", carId)
        .order("sent_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Updated subscription
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          console.log('New message received:', payload); // Debug log
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status); // Debug log
      });

    return () => {
      channel.unsubscribe();
    };
  }, [carId]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const newMessageData = {
      content: newMessage.trim(),
      user_id: userId,
      car_id: carId,
      sent_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("messages")
      .insert(newMessageData);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage(""); // Clear input after sending
      // Use Date.now() + random number for temporary ID
      setMessages((current) => [...current, { ...newMessageData, id: `temp-${Date.now()}-${Math.random()}` }]);
    }
  };

  const handleSplitPress = () => {
    Alert.alert(
      "Start Split Process",
      "Do you want to start the split process?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => router.push({
            pathname: '/verification',
            params: { carId }
          })
        }
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header Row with Split Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.splitButton}
            onPress={handleSplitPress}
          >
            <Image 
              source={require('../assets/images/split.png')} 
              style={styles.splitIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              content={item.content}
              isOwnMessage={item.user_id === userId}
              sentAt={item.sent_at}
            />
          )}
          contentContainerStyle={styles.flatListContent}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={110}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  splitButton: {
    padding: 8,
  },
  splitIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  flatListContent: {
    padding: 10,
    paddingBottom: 90,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f2f2f2",
    marginBottom: Platform.OS === "ios" ? 20 : 0,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
    borderRadius: 20,
    padding: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});