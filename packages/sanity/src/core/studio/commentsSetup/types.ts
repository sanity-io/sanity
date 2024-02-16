import {type SanityClient} from '@sanity/client'

/**
 * @beta
 * @hidden
 */
export interface CommentsSetupContextValue {
  /**
   * Addon dataset client, currently called `comments` dataset.
   */
  client: SanityClient | null
  isRunningSetup: boolean
  /**
   * Function to create the addon dataset if it does not exist.
   */
  runSetup: () => Promise<SanityClient | null>
}
