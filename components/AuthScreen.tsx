import { useSignIn, useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { styled } from "nativewind";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type AuthMode = "signIn" | "signUp";
type AuthStep =
    | "credentials"
    | "signUpCode"
    | "emailCode"
    | "verificationCode"
    | "resetEmail"
    | "resetCode"
    | "newPassword";
type MfaStrategy = "email_code" | "phone_code" | "totp" | "backup_code";
type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword" | "code", string>>;

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getRequestError(error: unknown, fallback: string) {
    if (typeof error !== "object" || error === null) return fallback;

    const details = error as {
        longMessage?: string;
        message?: string;
        errors?: { longMessage?: string; message?: string }[];
    };

    return (
        details.longMessage ||
        details.errors?.[0]?.longMessage ||
        details.errors?.[0]?.message ||
        details.message ||
        fallback
    );
}

type AuthFieldProps = {
    label: string;
    value: string;
    placeholder: string;
    onChangeText: (value: string) => void;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "number-pad";
    autoComplete?: "email" | "current-password" | "new-password" | "one-time-code";
    autoCapitalize?: "none" | "sentences";
    maxLength?: number;
};

function AuthField({
    label,
    value,
    placeholder,
    onChangeText,
    error,
    secureTextEntry,
    keyboardType = "default",
    autoComplete,
    autoCapitalize = "none",
    maxLength,
}: AuthFieldProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>
            {secureTextEntry ? (
                <View className={`auth-password-input ${error ? "auth-password-input-error" : ""}`}>
                    <TextInput
                        accessibilityLabel={label}
                        autoCapitalize={autoCapitalize}
                        autoComplete={autoComplete}
                        className="auth-input auth-password-text-input"
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(8, 17, 38, 0.48)"
                        returnKeyType="done"
                        secureTextEntry={!isPasswordVisible}
                        selectionColor="#ea7a53"
                        textContentType={
                            autoComplete === "current-password"
                                ? "password"
                                : autoComplete === "new-password"
                                    ? "newPassword"
                                    : autoComplete === "email"
                                        ? "emailAddress"
                                        : autoComplete === "one-time-code"
                                            ? "oneTimeCode"
                                            : "none"
                        }
                        value={value}
                    />
                    <Pressable
                        accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isPasswordVisible }}
                        className="auth-password-toggle"
                        onPress={() => setIsPasswordVisible((visible) => !visible)}
                    >
                        <SymbolView
                            name={{
                                ios: isPasswordVisible ? "eye.slash" : "eye",
                                android: isPasswordVisible ? "visibility_off" : "visibility",
                                web: isPasswordVisible ? "visibility_off" : "visibility",
                            }}
                            size={20}
                            tintColor="#ea7a53"
                        />
                    </Pressable>
                </View>
            ) : (
                <TextInput
                    accessibilityLabel={label}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    className={`auth-input ${error ? "auth-input-error" : ""}`}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(8, 17, 38, 0.48)"
                    returnKeyType="done"
                    secureTextEntry={false}
                    selectionColor="#ea7a53"
                    textContentType={
                        autoComplete === "current-password"
                            ? "password"
                            : autoComplete === "new-password"
                                ? "newPassword"
                                : autoComplete === "email"
                                    ? "emailAddress"
                                    : autoComplete === "one-time-code"
                                        ? "oneTimeCode"
                                        : "none"
                    }
                    value={value}
                />
            )}
            {error ? <Text className="auth-error">{error}</Text> : null}
        </View>
    );
}

type AuthScreenProps = { mode: AuthMode };

export default function AuthScreen({ mode }: AuthScreenProps) {
    const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
    const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
    const [step, setStep] = useState<AuthStep>("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [code, setCode] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [requestError, setRequestError] = useState("");
    const [notice, setNotice] = useState("");
    const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy | null>(null);
    const [challenge, setChallenge] = useState<"firstFactor" | "mfa" | null>(null);

    const isSignUp = mode === "signUp";
    const isBusy = signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";
    const normalizedEmail = email.trim().toLowerCase();

    const clearFeedback = () => {
        setRequestError("");
        setNotice("");
    };

    const updateField = (field: keyof FieldErrors, update: () => void) => {
        update();
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        clearFeedback();
    };

    const showRequestError = (error: unknown, fallback: string) => {
        setRequestError(getRequestError(error, fallback));
    };

    const validateEmail = () => {
        if (!isValidEmail(normalizedEmail)) {
            setFieldErrors((current) => ({ ...current, email: "Enter a valid email address." }));
            return false;
        }
        return true;
    };

    const validatePassword = (value: string, confirmation?: string) => {
        const nextErrors: FieldErrors = {};
        if (value.length < 15) nextErrors.password = "Use at least 15 characters.";
        if (confirmation !== undefined && value !== confirmation) {
            nextErrors.confirmPassword = "Your passwords do not match.";
        }
        setFieldErrors((current) => ({ ...current, ...nextErrors }));
        return Object.keys(nextErrors).length === 0;
    };

    const finishSignIn = async () => {
        const { error } = await signIn.finalize();
        if (error) showRequestError(error, "We couldn't finish signing you in. Please try again.");
    };

    const finishSignUp = async () => {
        const { error } = await signUp.finalize();
        if (error) showRequestError(error, "We couldn't finish creating your account. Please try again.");
    };

    const beginSecondFactor = async () => {
        const available = signIn.supportedSecondFactors;
        const preferred = (["email_code", "phone_code", "totp", "backup_code"] as const).find(
            (strategy) => available.some((factor) => factor.strategy === strategy),
        );

        if (!preferred) {
            setRequestError("This account needs another verification method. Contact support for help signing in.");
            return;
        }

        setMfaStrategy(preferred);
        setChallenge("mfa");
        if (preferred === "email_code") {
            const result = await signIn.mfa.sendEmailCode();
            if (result.error) {
                showRequestError(result.error, "We couldn't send a verification code. Please try again.");
                return;
            }
            setNotice("A secure code is on its way to your email.");
        } else if (preferred === "phone_code") {
            const result = await signIn.mfa.sendPhoneCode();
            if (result.error) {
                showRequestError(result.error, "We couldn't send a verification code. Please try again.");
                return;
            }
            setNotice("A secure code is on its way to your phone.");
        } else {
            setNotice(preferred === "totp" ? "Enter the code from your authenticator app." : "Enter one of your backup codes.");
        }
        setStep("verificationCode");
    };

    const handleCredentials = async () => {
        clearFeedback();
        const emailIsValid = validateEmail();
        const passwordIsValid = isSignUp
            ? validatePassword(password, confirmPassword)
            : password.length > 0;
        if (!isSignUp && !passwordIsValid) {
            setFieldErrors((current) => ({ ...current, password: "Enter your password." }));
        }
        if (!emailIsValid || !passwordIsValid) return;

        if (isSignUp) {
            const result = await signUp.password({ emailAddress: normalizedEmail, password });
            if (result.error) {
                showRequestError(result.error, "We couldn't create your account. Check your details and try again.");
                return;
            }

            if (signUp.status === "complete") {
                await finishSignUp();
            } else if (signUp.unverifiedFields.includes("email_address")) {
                const verification = await signUp.verifications.sendEmailCode();
                if (verification.error) {
                    showRequestError(verification.error, "We couldn't send your verification code. Please try again.");
                    return;
                }
                setStep("signUpCode");
                setNotice("We sent a verification code to your email.");
            } else {
                setRequestError("Your account needs more information before it can be created. Please contact support.");
            }
            return;
        }

        const result = await signIn.password({ emailAddress: normalizedEmail, password });
        if (result.error) {
            showRequestError(result.error, "We couldn't sign you in. Check your email and password.");
            return;
        }

        if (signIn.status === "complete") {
            await finishSignIn();
        } else if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
            await beginSecondFactor();
        } else if (signIn.status === "needs_first_factor") {
            const hasEmailCode = signIn.supportedFirstFactors.some((factor) => factor.strategy === "email_code");
            if (!hasEmailCode) {
                setRequestError("This account needs another sign-in method. Contact support for help.");
                return;
            }
            const verification = await signIn.emailCode.sendCode();
            if (verification.error) {
                showRequestError(verification.error, "We couldn't send a sign-in code. Please try again.");
                return;
            }
            setChallenge("firstFactor");
            setStep("emailCode");
            setNotice("We sent a secure sign-in code to your email.");
        } else {
            setRequestError("We couldn't complete that sign-in. Please review your details and try again.");
        }
    };

    const handleSignUpCode = async () => {
        clearFeedback();
        if (code.trim().length < 4) {
            setFieldErrors((current) => ({ ...current, code: "Enter the code from your email." }));
            return;
        }
        const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
        if (result.error) {
            showRequestError(result.error, "That code didn't work. Check it and try again.");
            return;
        }
        if (signUp.status === "complete") {
            await finishSignUp();
        } else {
            setRequestError("Your email is verified, but your account needs more information. Please contact support.");
        }
    };

    const handleVerificationCode = async () => {
        clearFeedback();
        if (code.trim().length < 4) {
            setFieldErrors((current) => ({ ...current, code: "Enter the code to continue." }));
            return;
        }

        const result =
            challenge === "firstFactor"
                ? await signIn.emailCode.verifyCode({ code: code.trim() })
                : mfaStrategy === "email_code"
                    ? await signIn.mfa.verifyEmailCode({ code: code.trim() })
                    : mfaStrategy === "phone_code"
                        ? await signIn.mfa.verifyPhoneCode({ code: code.trim() })
                        : mfaStrategy === "totp"
                            ? await signIn.mfa.verifyTOTP({ code: code.trim() })
                            : await signIn.mfa.verifyBackupCode({ code: code.trim() });

        if (result.error) {
            showRequestError(result.error, "That code didn't work. Check it and try again.");
            return;
        }
        if (signIn.status === "complete") {
            await finishSignIn();
        } else {
            setRequestError("We couldn't verify that code. Please try again or request a new one.");
        }
    };

    const handleResetRequest = async () => {
        clearFeedback();
        if (!validateEmail()) return;
        const start = await signIn.create({ identifier: normalizedEmail });
        if (start.error) {
            showRequestError(start.error, "We couldn't start password recovery. Please try again.");
            return;
        }
        const result = await signIn.resetPasswordEmailCode.sendCode();
        if (result.error) {
            showRequestError(result.error, "We couldn't send a recovery code. Please try again.");
            return;
        }
        setStep("resetCode");
        setNotice("If an account exists for this email, a recovery code is on its way.");
    };

    const handleResetCode = async () => {
        clearFeedback();
        if (code.trim().length < 4) {
            setFieldErrors((current) => ({ ...current, code: "Enter the code from your email." }));
            return;
        }
        const result = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
        if (result.error) {
            showRequestError(result.error, "That recovery code didn't work. Check it and try again.");
            return;
        }
        if (signIn.status === "needs_new_password") {
            setStep("newPassword");
            setNotice("Choose a new password for your account.");
        } else {
            setRequestError("We couldn't verify that recovery code. Please request a new one.");
        }
    };

    const handleNewPassword = async () => {
        clearFeedback();
        if (!validatePassword(password, confirmPassword)) return;
        const result = await signIn.resetPasswordEmailCode.submitPassword({
            password,
            signOutOfOtherSessions: true,
        });
        if (result.error) {
            showRequestError(result.error, "We couldn't update your password. Check the requirements and try again.");
            return;
        }
        if (signIn.status === "complete") {
            await finishSignIn();
        } else {
            setRequestError("Your password was updated, but we couldn't finish signing you in. Please sign in again.");
            setStep("credentials");
        }
    };

    const handleResendCode = async () => {
        clearFeedback();
        const result =
            step === "signUpCode"
                ? await signUp.verifications.sendEmailCode()
                : step === "resetCode"
                    ? await signIn.resetPasswordEmailCode.sendCode()
                    : challenge === "firstFactor"
                        ? await signIn.emailCode.sendCode()
                        : mfaStrategy === "email_code"
                            ? await signIn.mfa.sendEmailCode()
                            : mfaStrategy === "phone_code"
                                ? await signIn.mfa.sendPhoneCode()
                                : null;

        if (!result) return;
        if (result.error) {
            showRequestError(result.error, "We couldn't send another code. Please try again.");
            return;
        }
        setNotice("A new code is on its way.");
    };

    const handleStartOver = async () => {
        clearFeedback();
        setCode("");
        setFieldErrors({});
        if (isSignUp) {
            await signUp.reset();
            setStep("credentials");
            return;
        }
        await signIn.reset();
        setChallenge(null);
        setMfaStrategy(null);
        setStep("credentials");
    };

    const title =
        step === "signUpCode"
            ? "Verify your email"
            : step === "emailCode"
                ? "Check your inbox"
                : step === "verificationCode"
                    ? "Confirm it’s you"
                    : step === "resetEmail"
                        ? "Reset your password"
                        : step === "resetCode"
                            ? "Check your inbox"
                            : step === "newPassword"
                                ? "Choose a new password"
                                : isSignUp
                                    ? "Create your account"
                                    : "Welcome back";

    const subtitle =
        step === "signUpCode"
            ? `Enter the code we sent to ${normalizedEmail}.`
            : step === "emailCode"
                ? `Enter the sign-in code we sent to ${normalizedEmail}.`
                : step === "verificationCode"
                    ? "Enter your verification code to securely continue."
                    : step === "resetEmail"
                        ? "We’ll send a secure code to the email linked to your account."
                        : step === "resetCode"
                            ? `Enter the recovery code sent to ${normalizedEmail}.`
                            : step === "newPassword"
                                ? "Use a password you haven’t used here before."
                                : isSignUp
                                    ? "Track every renewal and keep your monthly spending clear."
                                    : "Sign in to stay ahead of your subscriptions.";

    const submitLabel =
        step === "signUpCode" || step === "emailCode" || step === "verificationCode" || step === "resetCode"
            ? "Verify and continue"
            : step === "resetEmail"
                ? "Send recovery code"
                : step === "newPassword"
                    ? "Update password"
                    : isSignUp
                        ? "Create account"
                        : "Sign in";

    const handleSubmit = () => {
        if (step === "credentials") return handleCredentials();
        if (step === "signUpCode") return handleSignUpCode();
        if (step === "emailCode" || step === "verificationCode") return handleVerificationCode();
        if (step === "resetEmail") return handleResetRequest();
        if (step === "resetCode") return handleResetCode();
        return handleNewPassword();
    };

    const canResend =
        step === "signUpCode" ||
        step === "emailCode" ||
        step === "resetCode" ||
        (step === "verificationCode" && (mfaStrategy === "email_code" || mfaStrategy === "phone_code"));

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                    className="auth-scroll"
                    contentContainerClassName="auth-content"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">S</Text>
                            </View>
                            <View>
                                <Text className="auth-wordmark">Subscribly</Text>
                                <Text className="auth-wordmark-sub">Smart billing</Text>
                            </View>
                        </View>
                        <Text className="auth-title">{title}</Text>
                        <Text className="auth-subtitle">{subtitle}</Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            {step === "credentials" || step === "resetEmail" ? (
                                <AuthField
                                    autoComplete="email"
                                    error={fieldErrors.email}
                                    keyboardType="email-address"
                                    label="Email"
                                    onChangeText={(value) => updateField("email", () => setEmail(value))}
                                    placeholder="you@example.com"
                                    value={email}
                                />
                            ) : null}

                            {step === "credentials" ? (
                                <>
                                    <AuthField
                                        autoComplete={isSignUp ? "new-password" : "current-password"}
                                        error={fieldErrors.password}
                                        label="Password"
                                        onChangeText={(value) => updateField("password", () => setPassword(value))}
                                        placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                                        secureTextEntry
                                        value={password}
                                    />
                                    {isSignUp ? (
                                        <AuthField
                                            autoComplete="new-password"
                                            error={fieldErrors.confirmPassword}
                                            label="Confirm password"
                                            onChangeText={(value) => updateField("confirmPassword", () => setConfirmPassword(value))}
                                            placeholder="Enter your password again"
                                            secureTextEntry
                                            value={confirmPassword}
                                        />
                                    ) : (
                                        <Pressable
                                            accessibilityRole="button"
                                            className="self-end py-1"
                                            onPress={() => {
                                                clearFeedback();
                                                setStep("resetEmail");
                                            }}
                                        >
                                            <Text className="auth-link">Forgot password?</Text>
                                        </Pressable>
                                    )}
                                </>
                            ) : null}

                            {step === "signUpCode" ||
                                step === "emailCode" ||
                                step === "verificationCode" ||
                                step === "resetCode" ? (
                                <AuthField
                                    autoComplete="one-time-code"
                                    error={fieldErrors.code}
                                    keyboardType="number-pad"
                                    label="Verification code"
                                    maxLength={8}
                                    onChangeText={(value) => updateField("code", () => setCode(value.replace(/\s/g, "")))}
                                    placeholder="Enter your code"
                                    value={code}
                                />
                            ) : null}

                            {step === "newPassword" ? (
                                <>
                                    <AuthField
                                        autoComplete="new-password"
                                        error={fieldErrors.password}
                                        label="New password"
                                        onChangeText={(value) => updateField("password", () => setPassword(value))}
                                        placeholder="At least 8 characters"
                                        secureTextEntry
                                        value={password}
                                    />
                                    <AuthField
                                        autoComplete="new-password"
                                        error={fieldErrors.confirmPassword}
                                        label="Confirm new password"
                                        onChangeText={(value) => updateField("confirmPassword", () => setConfirmPassword(value))}
                                        placeholder="Enter your password again"
                                        secureTextEntry
                                        value={confirmPassword}
                                    />
                                </>
                            ) : null}

                            {requestError ? (
                                <Text accessibilityLiveRegion="polite" className="auth-error">
                                    {requestError}
                                </Text>
                            ) : null}
                            {notice ? (
                                <Text accessibilityLiveRegion="polite" className="auth-helper">
                                    {notice}
                                </Text>
                            ) : null}

                            <Pressable
                                accessibilityRole="button"
                                className={`auth-button ${isBusy ? "auth-button-disabled" : ""}`}
                                disabled={isBusy}
                                onPress={handleSubmit}
                            >
                                {isBusy ? (
                                    <ActivityIndicator color="#081126" />
                                ) : (
                                    <Text className="auth-button-text">{submitLabel}</Text>
                                )}
                            </Pressable>

                            {canResend ? (
                                <Pressable
                                    accessibilityRole="button"
                                    className="auth-secondary-button"
                                    disabled={isBusy}
                                    onPress={handleResendCode}
                                >
                                    <Text className="auth-secondary-button-text">Send a new code</Text>
                                </Pressable>
                            ) : null}

                            {step !== "credentials" ? (
                                <Pressable
                                    accessibilityRole="button"
                                    className="items-center py-2"
                                    disabled={isBusy}
                                    onPress={handleStartOver}
                                >
                                    <Text className="auth-link">{step === "resetEmail" ? "Back to sign in" : "Start over"}</Text>
                                </Pressable>
                            ) : null}
                        </View>

                        {step === "credentials" ? (
                            <View className="auth-link-row">
                                <Text className="auth-link-copy">
                                    {isSignUp ? "Already have an account?" : "New to Recurly?"}
                                </Text>
                                {isSignUp ? (
                                    <Link href="/(auth)/signIn" asChild>
                                        <Pressable accessibilityRole="link">
                                            <Text className="auth-link">Sign in</Text>
                                        </Pressable>
                                    </Link>
                                ) : (
                                    <Link href="/(auth)/signUp" asChild>
                                        <Pressable accessibilityRole="link">
                                            <Text className="auth-link">Create an account</Text>
                                        </Pressable>
                                    </Link>
                                )}
                            </View>
                        ) : null}
                    </View>

                    <View nativeID="clerk-captcha" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}