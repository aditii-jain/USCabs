import { Stack } from "expo-router"; // Import Expo Router's stack navigation

/**
 * RootLayout defines the main navigation structure of the app using Expo Router.
 * It organizes screens into a stack-based navigation system.
 */
export default function RootLayout() {
  return (
    <Stack>
      {/* Landing page: This is the main entry point of the app */}
      <Stack.Screen 
        name="index" 
        options={{ title: "Home" }} 
      />
      
      {/* Authentication screens for user login and registration */}
      <Stack.Screen 
        name="auth/SignUp" 
        options={{ title: "Sign Up" }} 
      />
      <Stack.Screen 
        name="auth/SignIn" 
        options={{ title: "Sign In" }} 
      />
      
      {/* Main authenticated home screen after successful login */}
      <Stack.Screen 
        name="home" 
        options={{ title: "Home" }} 
      />
    </Stack>
  );
}