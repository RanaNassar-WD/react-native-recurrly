import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { posthog } from "../../lib/posthog";
import { posthogLogger } from "../../lib/posthog-logs";
const SafeAreaView = styled(RNSafeAreaView);

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    try {
      await signOut();
      posthog?.capture("signed_out");
      posthogLogger.info("Sign-out completed");
      posthog?.reset();
      router.replace("/(auth)/signIn");
    } catch {
      setError("We couldn't sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
      <View className="mt-6 rounded-2xl border border-border bg-card p-5">
        <Text className="text-base font-sans-semibold text-primary">
          {user?.fullName || "Your account"}
        </Text>
        <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress || "Signed in"}
        </Text>
      </View>
      {error ? <Text className="mt-4 text-sm font-sans-medium text-destructive">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        className={`mt-6 items-center rounded-2xl bg-primary py-4 ${isSigningOut ? "opacity-50" : ""}`}
        disabled={isSigningOut}
        onPress={handleSignOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#fff9e3" />
        ) : (
          <Text className="font-sans-bold text-background">Sign out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
