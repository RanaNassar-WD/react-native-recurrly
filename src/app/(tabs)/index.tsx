import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import CreateSubscriptionModal from "../../components/CreateSubscriptionModal";
import ListHeading from "../../../components/ListHeading";
import SubscriptionCard from "../../../components/SubscriptionCard";
import UpcomingSubscriptionsCard from "../../../components/UpcomingSubscriptionsCard";
import { HOME_BALANCE, HOME_USER, UPCOMING_SUBSCRIPTIONS } from "../../../constants/data";
import { icons } from "../../../constants/icons";
import images from "../../../constants/images";
import { formatCurrency } from "../../../lib/utils";
import { posthog } from "../../lib/posthog";
import { posthogLogger } from "../../lib/posthog-logs";
import { useSubscriptions } from "../../components/SubscriptionContext";
const SafeAreaView = styled(RNSafeAreaView);
export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const { subscriptions, addSubscription } = useSubscriptions();

  const handleSubscriptionPress = (subscriptionId: string) => {
    const isExpanding = expandedSubscriptionId !== subscriptionId;
    posthog?.capture("subscription_details_toggled", {
      subscription_id: subscriptionId,
      is_expanding: isExpanding,
    });
    posthogLogger.info("Subscription details toggled", { is_expanding: isExpanding });
    setExpandedSubscriptionId(isExpanding ? subscriptionId : null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">


      <FlatList showsVerticalScrollIndicator={false} ListHeaderComponent={() => (
        <>
          <View className="home-header">
            <View className="home-user">
              <Image source={images.girlAvatar} className="home-avatar" />
              <Text className="home-user-name">{HOME_USER.name}</Text>
            </View>
            <Pressable
              accessibilityLabel="Add subscription"
              accessibilityRole="button"
              className="home-add-icon"
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Image source={icons.add} resizeMode="contain" className="size-6" />
            </Pressable>
          </View>

          <View className="home-balance-card">
            <Text className="home-balance-label">Balance</Text>
            <View className="home-balance-row">
              <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
              <Text className="home-balance-date">
                {dayjs(HOME_BALANCE.nextRenewalDate).format("DD/MM")}
              </Text>
            </View>
          </View>

          <View>
            <ListHeading title="Upcoming" />
            <FlatList
              data={UPCOMING_SUBSCRIPTIONS}
              renderItem={({ item }) => <UpcomingSubscriptionsCard {...item} />}
              keyExtractor={(item) => item.id}
              horizontal
              ListEmptyComponent={<Text className="home-empty-state"> No upcoming subscriptions</Text>}
            />
          </View>

          <ListHeading title="All Subscriptions" />
        </>
      )} data={subscriptions} renderItem={({ item }) => <SubscriptionCard {...item} expanded={expandedSubscriptionId === item.id} onPress={() => handleSubscriptionPress(item.id)} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-20"
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={<Text className="home-empty-state"> No subscriptions yet.</Text>}
      />

      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={addSubscription}
      />
    </SafeAreaView>
  );
}
