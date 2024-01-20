import {type SanityClient} from '@sanity/client'

import {type CommentPostPayload} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface CommentsSetupContextValue {
  client: SanityClient | null
  isRunningSetup: boolean
  runSetup: (comment: CommentPostPayload) => Promise<void>
}
