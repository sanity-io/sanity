import {type SanityClient} from '@sanity/client'

/**
 * @beta
 * @hidden
 */
export interface AddonDatasetContextValue {
  /**
   * Addon dataset client, currently called `comments` dataset.
   */
  client: SanityClient | null
  isCreatingDataset: boolean
  /**
   * Function to create the addon dataset if it does not exist.
   */
  createAddonDataset: () => Promise<SanityClient | null>
  ready: boolean
}
