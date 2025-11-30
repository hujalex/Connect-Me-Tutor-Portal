import { PostHog } from "posthog-node";

// Singleton pattern to reuse PostHog client instance
let posthogClient: PostHog | null = null;

/**
 * Get or create PostHog client instance
 * Uses singleton pattern to reuse connection
 */
function getPostHogClient(): PostHog | null {
  // Return null if PostHog is not configured (graceful degradation)
  if (
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  ) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1, // Flush immediately for real-time debugging
      flushInterval: 0, // Disable interval flushing, use immediate
    });
  }

  return posthogClient;
}

/**
 * Log an event to PostHog with properties
 * Gracefully handles cases where PostHog is not configured
 */
export async function logEvent(
  eventName: string,
  properties?: Record<string, any>,
  distinctId?: string
) {
  const client = getPostHogClient();
  if (!client) {
    // Silently fail if PostHog is not configured
    return;
  }

  try {
    client.capture({
      distinctId: distinctId || "zoom-webhook",
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });

    // Flush immediately for real-time debugging
    await client.flush();
  } catch (error) {
    // Log error but don't throw - we don't want PostHog failures to break webhooks
    console.error("PostHog logging error:", error);
  }
}

/**
 * Log an error event to PostHog
 */
export async function logError(
  error: Error | unknown,
  context?: Record<string, any>,
  distinctId?: string
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.log("error stack: ", errorStack);

  await logEvent(
    "zoom_webhook_error",
    {
      error_message: errorMessage,
      error_stack: errorStack,
      ...context,
    },
    distinctId
  );
}

// Export the client function for direct use if needed
export default function PostHogClient() {
  return getPostHogClient();
}
