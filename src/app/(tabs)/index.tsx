import { Link } from "expo-router";
import { Text, View } from "react-native";

 
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Rana'a App using Nativewind!
      </Text>
      <Link href="/onboarding" className="mt-4 p-4  bg-primary text-white rounded">
        Go to Onboarding
      </Link>
       <Link href="/(auth)/signIn" className="mt-4 p-4  bg-primary text-white rounded">
        Sign In
      </Link>
       <Link href="/(auth)/signUp" className="mt-4 p-4  bg-primary text-white rounded">
        Sign Up
      </Link>
       <Link href ={{pathname: "/subscriptions/[id]", params: { id: "spotify" }}} className="mt-4 p-4  bg-primary text-white rounded">
        View Spotify Subscription
      </Link>
      <Link href ={{pathname: "/subscriptions/[id]", params: { id: "claude" }}} className="mt-4 p-4  bg-primary text-white rounded">
        View Claude Subscription
      </Link>
    </View>
  );
}