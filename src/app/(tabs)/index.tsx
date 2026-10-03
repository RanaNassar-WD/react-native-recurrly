import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text, } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
 const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
       <Text className="text-5xl font-sans-extrabold">
        Home
      </Text>
    
      <Link href="/onboarding" className="mt-4 p-4  font-sans-bold bg-primary text-white rounded">
        Go to Onboarding
      </Link>
       <Link href="/(auth)/signIn" className="mt-4 p-4  font-sans-bold bg-primary text-white rounded">
        Sign In
      </Link>
       <Link href="/(auth)/signUp" className="mt-4 p-4  font-sans-bold bg-primary text-white rounded">
        Sign Up
      </Link>
     
    </SafeAreaView>
  );
}