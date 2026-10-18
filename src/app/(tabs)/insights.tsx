import dayjs, { type Dayjs } from "dayjs";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { formatCurrency } from "../../../lib/utils";
import { useSubscriptions } from "../../components/SubscriptionContext";

const SafeAreaView = styled(RNSafeAreaView);
const daysInWeek = 7;
const visibleHistoryCount = 3;
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getNextRenewal(subscription: Subscription, today: Dayjs) {
  if (!subscription.renewalDate) return null;

  let nextRenewal = dayjs(subscription.renewalDate);
  if (!nextRenewal.isValid()) return null;

  const billing = (subscription.frequency ?? subscription.billing).toLowerCase();
  const interval = billing.includes("year") || billing.includes("annual") ? "year" : "month";

  while (nextRenewal.startOf("day").isBefore(today)) {
    nextRenewal = nextRenewal.add(1, interval);
  }

  return nextRenewal;
}

export default function InsightsScreen() {
  const { subscriptions } = useSubscriptions();
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  const { activeSubscriptions, monthlyExpense, upcomingByWeekday, upcomingRenewals, history } =
    useMemo(() => {
      const today = dayjs().startOf("day");
      const lastDay = today.add(daysInWeek - 1, "day").endOf("day");
      const active = subscriptions.filter(
        (subscription) => subscription.status?.toLowerCase() === "active",
      );
      const currency = active[0]?.currency ?? "USD";
      const matchingCurrency = active.filter(
        (subscription) => (subscription.currency ?? "USD") === currency,
      );
      const monthlyTotal = matchingCurrency.reduce((total, subscription) => {
        const billing = (subscription.frequency ?? subscription.billing).toLowerCase();
        return total + (billing.includes("year") || billing.includes("annual")
          ? subscription.price / 12
          : subscription.price);
      }, 0);
      const renewals = matchingCurrency.flatMap((subscription) => {
        const date = getNextRenewal(subscription, today);
        if (!date || date.isAfter(lastDay)) return [];
        return [{ subscription, date }];
      });
      const nextSevenDays = Array.from({ length: daysInWeek }, (_, index) =>
        today.add(index, "day"),
      );
      const weekdays = weekdayLabels.map((label, weekdayIndex) => ({
        label,
        amount: 0,
        date:
          nextSevenDays.find(
            (date) => (date.day() + 6) % daysInWeek === weekdayIndex,
          ) ?? today,
      }));

      for (const renewal of renewals) {
        const mondayFirstIndex = (renewal.date.day() + 6) % daysInWeek;
        weekdays[mondayFirstIndex].amount += renewal.subscription.price;
      }

      const sortedHistory = [...subscriptions].sort((first, second) => {
        const firstDate = dayjs(first.renewalDate ?? first.startDate);
        const secondDate = dayjs(second.renewalDate ?? second.startDate);
        return secondDate.valueOf() - firstDate.valueOf();
      });

      return {
        activeSubscriptions: matchingCurrency,
        monthlyExpense: monthlyTotal,
        upcomingByWeekday: weekdays,
        upcomingRenewals: renewals.sort((first, second) => first.date.valueOf() - second.date.valueOf()),
        history: sortedHistory,
      };
    }, [subscriptions]);

  const currency = activeSubscriptions[0]?.currency ?? "USD";
  const chartMaximum = Math.max(...upcomingByWeekday.map((day) => day.amount), 1);
  const displayedHistory = showAllHistory ? history : history.slice(0, visibleHistoryCount);
  const hasMixedCurrencies =
    new Set(
      subscriptions
        .filter((subscription) => subscription.status?.toLowerCase() === "active")
        .map((subscription) => subscription.currency ?? "USD"),
    ).size > 1;

  return (
    <SafeAreaView className="insights-screen">
      <ScrollView
        className="flex-1"
        contentContainerClassName="insights-scroll-content"
        showsVerticalScrollIndicator={false}
      >
        <View className="insights-header">
          <Text className="insights-title">Monthly Insights</Text>
          <Text className="insights-subtitle">A clearer view of your subscriptions.</Text>
        </View>

        <View className="insights-section-heading">
          <View>
            <Text className="insights-section-title">Upcoming</Text>
            <Text className="insights-section-caption">Renewals in the next 7 days</Text>
          </View>
          {upcomingRenewals.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllUpcoming((showing) => !showing)}
              className="insights-view-all"
            >
              <Text className="insights-view-all-text">
                {showAllUpcoming ? "Hide" : "View all"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="insights-chart-card">
          <View className="insights-chart-summary">
            <Text className="insights-chart-caption">Expected renewals</Text>
            <Text className="insights-chart-total">
              {formatCurrency(
                upcomingRenewals.reduce(
                  (total, renewal) => total + renewal.subscription.price,
                  0,
                ),
                currency,
              )}
            </Text>
          </View>
          <View className="insights-chart">
            <View className="insights-axis">
              <Text className="insights-axis-label">{formatCurrency(chartMaximum, currency)}</Text>
              <Text className="insights-axis-label">
                {formatCurrency(chartMaximum / 2, currency)}
              </Text>
              <Text className="insights-axis-label">{formatCurrency(0, currency)}</Text>
            </View>
            <View className="insights-bars">
              {[25, 55, 85].map((top) => (
                <View
                  key={top}
                  className="insights-grid-line"
                  style={{ top: `${top}%` }}
                  pointerEvents="none"
                />
              ))}
              {upcomingByWeekday.map((day) => {
                const weekdayIndex = weekdayLabels.indexOf(day.label);
                const height = day.amount === 0 ? 2 : Math.max((day.amount / chartMaximum) * 76, 8);
                const isSelected =
                  selectedWeekday === weekdayIndex ||
                  (selectedWeekday === null && day.date.isSame(dayjs(), "day"));

                return (
                  <Pressable
                    key={day.label}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.label}, ${formatCurrency(day.amount, currency)}`}
                    onPress={() => setSelectedWeekday(weekdayIndex)}
                    className="insights-bar-column"
                  >
                    {isSelected ? (
                      <View
                        className="insights-tooltip self-center"
                        style={{ top: `${Math.max(3, 100 - height - 16)}%` }}
                      >
                        <Text className="insights-tooltip-text">
                          {formatCurrency(day.amount, currency)}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      className={isSelected ? "insights-bar insights-bar-selected" : "insights-bar"}
                      style={{ height: `${height}%` }}
                    />
                    <Text className="insights-day-label">{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {hasMixedCurrencies ? (
            <Text className="insights-currency-note">
              Totals are shown in {currency}; other currencies are not converted.
            </Text>
          ) : null}
          {showAllUpcoming ? (
            <View className="insights-upcoming-list">
              {upcomingRenewals.map(({ subscription, date }) => (
                <View key={subscription.id} className="insights-upcoming-row">
                  <View className="insights-upcoming-copy">
                    <Text className="insights-upcoming-name" numberOfLines={1}>
                      {subscription.name}
                    </Text>
                    <Text className="insights-upcoming-date">{date.format("MMMM D, h:mm A")}</Text>
                  </View>
                  <Text className="insights-upcoming-amount">
                    {formatCurrency(subscription.price, currency)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="insights-expense-card">
          <View className="insights-expense-copy">
            <Text className="insights-expense-title">Monthly expenses</Text>
            <Text className="insights-expense-caption">Active subscriptions · monthly equivalent</Text>
          </View>
          <Text className="insights-expense-amount">
            {formatCurrency(monthlyExpense, currency)}
          </Text>
        </View>

        <View className="insights-section-heading insights-history-heading">
          <View>
            <Text className="insights-section-title">History</Text>
            <Text className="insights-section-caption">Your saved subscriptions</Text>
          </View>
          {history.length > visibleHistoryCount ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllHistory((showing) => !showing)}
              className="insights-view-all"
            >
              <Text className="insights-view-all-text">
                {showAllHistory ? "Show less" : "View all"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {displayedHistory.length > 0 ? (
          <View className="insights-history-list">
            {displayedHistory.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                {...subscription}
                expanded={expandedSubscriptionId === subscription.id}
                onPress={() =>
                  setExpandedSubscriptionId((currentId) =>
                    currentId === subscription.id ? null : subscription.id,
                  )
                }
              />
            ))}
          </View>
        ) : (
          <View className="insights-empty-card">
            <Text className="insights-empty-title">No subscriptions yet</Text>
            <Text className="insights-empty-copy">
              Add a subscription to see your spending insights here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
