import {type ClientConfig, type SanityClient} from '@sanity/client'

/**
 * Extracts a serializable client configuration from a SanityClient instance.
 *
 * This is used to pass client configuration to worker threads, which cannot
 * receive non-serializable objects. The worker can then use this config to
 * create its own SanityClient instance.
 *
 * @param client - The SanityClient instance to extract config from
 * @returns A serializable partial ClientConfig
 */
export function extractClientConfig(client: SanityClient): Partial<ClientConfig> {
  const config = client.config()

  // Use JSON.parse/stringify to strip non-serializable properties (functions, etc.)
  // and add flags needed for worker environment
  return {
    ...JSON.parse(JSON.stringify(config)),
    // Ensure we use project hostname even if the original config didn't require project
    useProjectHostname: true,
    // Suppress browser token warning since we mock browser environment in workers
    ignoreBrowserTokenWarning: true,
  }
}
