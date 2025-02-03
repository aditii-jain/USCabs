import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function EmailForm({ type }: { type: "signup" | "signin" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    if (!isValidUSCEmail(email)) {
      Alert.alert("Invalid email", "Please use a valid USC email address.");
      setLoading(false);
      return;
    }

    try {
      if (type === "signup") {
        if (fullName.length < 3) {
          Alert.alert("Invalid name", "Name must be at least 3 characters long.");
          return;
        }

        // Sign up without email confirmation
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              venmo_username: venmoUsername || null
            },
            emailRedirectTo: undefined 
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (user) {
          // Sign in immediately after signup
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) throw signInError;
          
          router.push("/home");
        }
      } else {
        // Regular sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/home");
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      Alert.alert(
        "Error", 
        error.message === 'Password should be at least 6 characters' 
          ? error.message 
          : 'Failed to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {type === "signup" ? "Sign up and save $$" : "Welcome Back"}
          </Text>
          {type === "signup" && (
            <View style={styles.inputContainer}>
              <Image
                source={require("../assets/images/user.png")}
                style={styles.icon}
              />
              <TextInput
                placeholder="What should we call you?"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          )}
          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/images/email.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="USC Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>
          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/images/lock.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
            />
          </View>
          {type === "signup" && (
            <View style={styles.inputContainer}>
              <Image
                source={require("../assets/images/venmo.png")}
                style={styles.icon}
              />
              <TextInput
                placeholder="Your Venmo Username"
                value={venmoUsername}
                onChangeText={setVenmoUsername}
                style={styles.input}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Loading..."
                : type === "signup"
                ? "Join Now"
                : "Login"}
            </Text>
          </TouchableOpacity>
          <View style={styles.footer}>
            {type === "signup" ? (
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <TouchableOpacity onPress={() => router.push("/auth/SignIn")}>
                  <Text style={styles.link}>Sign in</Text>
                </TouchableOpacity>
              </Text>
            ) : (
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <TouchableOpacity onPress={() => router.push("/auth/SignUp")}>
                  <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function isValidUSCEmail(email: string) {
  const uscEmailRegex = /^[a-zA-Z0-9._%+-]+@usc\.edu$/;
  return uscEmailRegex.test(email);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#aaa",
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 10,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
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
  footer: {
    flexDirection: "row",
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    textAlign: "center",
  },
  link: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    color: "#000",
  },
});