import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HOME_SUBSCRIPTIONS } from "../../constants/data";

type SubscriptionContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);
  const addSubscription = useCallback((subscription: Subscription) => {
    setSubscriptions((currentSubscriptions) => [subscription, ...currentSubscriptions]);
  }, []);
  const value = useMemo(
    () => ({ subscriptions, addSubscription }),
    [subscriptions, addSubscription],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptions must be used within a SubscriptionProvider.");
  }
  return context;
}
