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
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import MessageBubble from "../components/MessageBubble";
import { Message } from "../types/database"; // Import your interface
import { router } from 'expo-router';

interface MessageWithUser extends Message {
  profiles?: {
    full_name: string;
  };
}

export default function Messaging() {
  // Get the car ID from route parameters
  const { carId } = useLocalSearchParams<{ carId: string }>();
  // State management
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  // Reference to scroll messages to bottom
  const flatListRef = useRef<FlatList>(null);

  // Fetch current user's ID on component mount
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

  // Set up real-time messaging
  useEffect(() => {
    // Initial fetch of existing messages with user profiles
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq("car_id", carId)
        .order("sent_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Set up real-time subscription for new messages
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
        async (payload) => {
          // Fetch the user profile for the new message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();

          const messageWithUser = {
            ...payload.new,
            profiles: profileData
          } as MessageWithUser;

          setMessages((current) => [...current, messageWithUser]);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [carId]);

  // Handle sending new messages
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
      setNewMessage(""); // Clear input
      // Add message to local state with temporary ID
      setMessages((current) => [...current, { ...newMessageData, id: `temp-${Date.now()}-${Math.random()}` }]);
    }
  };

  // Handle initiating the payment split process
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/"); // Navigate to landing page
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header Row with Split Button and Sign Out */}
        <View style={styles.headerRow}>
          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Spacer to push split button to right */}
          <View style={styles.headerSpacer} />

          {/* Split Button */}
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
            <View>
              {/* Show sender's name only for received messages */}
              {item.user_id !== userId && item.profiles && (
                <Text style={styles.senderName}>
                  {item.profiles.full_name}
                </Text>
              )}
              <MessageBubble
                content={item.content}
                isOwnMessage={item.user_id === userId}
                sentAt={item.sent_at}
              />
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerSpacer: {
    flex: 1,
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: '#007AFF',
    fontSize: 16,
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
  senderName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
    marginBottom: 2,
  },
});