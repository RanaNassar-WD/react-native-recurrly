import PostHog from "posthog-react-native";

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const missingConfigVariable = !projectToken
  ? "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN"
  : !host
    ? "EXPO_PUBLIC_POSTHOG_HOST"
    : undefined;

if (__DEV__ && missingConfigVariable) {
  throw new Error(
    `${missingConfigVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingConfigVariable} is configured`,
  );
}

export const posthog =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        logs: {
          serviceName: "subscribly-mobile",
        },
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
          },
        },
      })
    : undefined;
