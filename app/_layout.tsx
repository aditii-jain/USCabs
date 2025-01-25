import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path } = Linking.parse(url);
      if (path === "auth-callback") {
        // Navigate to home screen after successful verification
        router.replace("/home");
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="auth/SignUp" options={{ title: "Sign Up" }} />
      <Stack.Screen name="auth/SignIn" options={{ title: "Sign In" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
    </Stack>
  );
}