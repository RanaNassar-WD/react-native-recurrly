import { SymbolView } from "expo-symbols";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { useSubscriptions } from "../../components/SubscriptionContext";

const SafeAreaView = styled(RNSafeAreaView);

export default function SubscriptionsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const { subscriptions } = useSubscriptions();

  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.plan,
        subscription.category,
        subscription.paymentMethod,
        subscription.status,
        subscription.billing,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchQuery, subscriptions]);

  const handleSubscriptionPress = (subscriptionId: string) => {
    setExpandedSubscriptionId((currentId) => (currentId === subscriptionId ? null : subscriptionId));
  };

  return (
    <SafeAreaView className="subscriptions-screen">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={filteredSubscriptions}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() => handleSubscriptionPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerClassName="subscriptions-list-content"
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="subscriptions-header">
              <Text className="subscriptions-title">Subscriptions</Text>
              <Text className="subscriptions-subtitle">Search and manage your recurring payments.</Text>

              <View className="subscriptions-search">
                <SymbolView
                  name={{ ios: "magnifyingglass", android: "search", web: "search" }}
                  size={20}
                  tintColor="#536078"
                />
                <TextInput
                  accessibilityLabel="Search subscriptions"
                  autoCapitalize="none"
                  className="subscriptions-search-input"
                  onChangeText={setSearchQuery}
                  placeholder="Search subscriptions"
                  placeholderTextColor="rgba(8, 17, 38, 0.48)"
                  returnKeyType="search"
                  value={searchQuery}
                />
                {searchQuery.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                    className="subscriptions-search-clear"
                    onPress={() => setSearchQuery("")}
                  >
                    <Text className="subscriptions-search-clear-text">Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="subscriptions-empty">
              <Text className="subscriptions-empty-title">No subscriptions found</Text>
              <Text className="subscriptions-empty-text">
                Try a different name, plan, category, or payment method.
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
