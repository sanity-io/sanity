import {SanityClient} from '@sanity/client'
import {TaskPostPayload} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface TasksSetupContextValue {
  client: SanityClient | null
  isRunningSetup: boolean
  runSetup: (task: TaskPostPayload) => Promise<void>
}
