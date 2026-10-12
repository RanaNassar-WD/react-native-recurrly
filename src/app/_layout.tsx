import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { router, SplashScreen, Stack, useSegments } from "expo-router";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { posthog } from "../lib/posthog";
import "../../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey?.startsWith("pk_")) {
  throw new Error("Set a valid EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file.");
}

function AppNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const identifiedUserId = useRef<string | null>(null);
  const segments = useSegments();
  const currentGroup = segments[0];

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      identifiedUserId.current = null;
      return;
    }

    if (!user || identifiedUserId.current === user.id) return;

    const email = user.primaryEmailAddress?.emailAddress;
    const properties = {
      ...(email ? { email } : {}),
      ...(user.fullName ? { name: user.fullName } : {}),
    };

    posthog?.identify(user.id, { $set: properties });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && currentGroup === "(auth)") {
      router.replace("/(tabs)");
    } else if (!isSignedIn && currentGroup !== "(auth)") {
      router.replace("/(auth)/signIn");
    }
  }, [currentGroup, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#ea7a53" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontLoaded] = useFonts({
    "sans-regular": require("../../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-semibold": require("../../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-bold": require("../../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-extrabold": require("../../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../../assets/fonts/PlusJakartaSans-Light.ttf"),
    "sans-medium": require("../../assets/fonts/PlusJakartaSans-Medium.ttf"),
  });
  useEffect(() => {
    if (fontLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontLoaded]);
  if (!fontLoaded) {
    return null;
  }
  const app = <AppNavigator />;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app}
    </ClerkProvider>
  );
}
