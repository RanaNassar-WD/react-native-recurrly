import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons } from "../../constants/icons";
import { getSubscriptionIcon } from "./SubscriptionIcon";

const categories = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;
type SubscriptionCategory = (typeof categories)[number];
type SubscriptionFrequency = "Monthly" | "Yearly";

const categoryColors: Record<SubscriptionCategory, string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#f6eecf",
  Cloud: "#c8d9f2",
  Music: "#f3c6a5",
  Other: "#e8def8",
};

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("Monthly");
  const [category, setCategory] = useState<SubscriptionCategory>("Other");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const parsedPrice = Number(price.trim());
  const isValidName = name.trim().length > 0;
  const isValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const isFormValid = isValidName && isValidPrice;
  const isSubmitDisabled = hasAttemptedSubmit && !isFormValid;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    setNameError("");
    setPriceError("");
    setHasAttemptedSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (hasAttemptedSubmit) {
      setNameError(value.trim() ? "" : "Enter a subscription name.");
    }
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (hasAttemptedSubmit) {
      const nextPrice = Number(value.trim());
      setPriceError(Number.isFinite(nextPrice) && nextPrice > 0 ? "" : "Enter a price greater than zero.");
    }
  };

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    setNameError(isValidName ? "" : "Enter a subscription name.");
    setPriceError(isValidPrice ? "" : "Enter a price greater than zero.");
    if (!isValidName || !isValidPrice) return;

    const now = dayjs();
    const renewalDate = now
      .add(1, frequency === "Monthly" ? "month" : "year")
      .toISOString();
    const subscription: Subscription = {
      id: `subscription-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate: now.toISOString(),
      renewalDate,
      icon: getSubscriptionIcon(name.trim()),
      billing: frequency,
      color: categoryColors[category],
    };

    onCreate(subscription);
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View className="modal-overlay">
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="modal-container">
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityLabel="Close new subscription form"
                accessibilityRole="button"
                className="modal-close"
                onPress={handleClose}
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView
              className="max-h-full"
              contentContainerClassName="modal-body"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  accessibilityLabel="Subscription name"
                  autoCapitalize="words"
                  className="auth-input"
                  onChangeText={handleNameChange}
                  placeholder="e.g. Netflix"
                  placeholderTextColor="rgba(8, 17, 38, 0.48)"
                  returnKeyType="next"
                  value={name}
                />
                {nameError ? <Text className="auth-error">{nameError}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  accessibilityLabel="Subscription price"
                  className="auth-input"
                  keyboardType="decimal-pad"
                  onChangeText={handlePriceChange}
                  placeholder="0.00"
                  placeholderTextColor="rgba(8, 17, 38, 0.48)"
                  returnKeyType="done"
                  value={price}
                />
                {priceError ? <Text className="auth-error">{priceError}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((option) => {
                    const isActive = frequency === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                        className={clsx("picker-option", isActive && "picker-option-active")}
                        onPress={() => setFrequency(option)}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            isActive && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {categories.map((option) => {
                    const isActive = category === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                        className={clsx("category-chip", isActive && "category-chip-active")}
                        onPress={() => setCategory(option)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            isActive && "category-chip-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                className={clsx("auth-button", isSubmitDisabled && "auth-button-disabled")}
                disabled={isSubmitDisabled}
                onPress={handleSubmit}
              >
                <Text className="auth-button-text">Create Subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
