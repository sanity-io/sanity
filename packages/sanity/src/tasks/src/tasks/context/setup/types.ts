import {type SanityClient} from '@sanity/client'

/**
 * @beta
 * @hidden
 */
export interface TasksSetupContextValue {
  client: SanityClient | null
  isRunningSetup: boolean
  /**
   * Creates a client for the addon dataset and returns it.
   * Also, sets the client in the state to reuse.
   */
  runSetup: () => Promise<SanityClient>
}
