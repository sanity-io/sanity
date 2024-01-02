import {SanityClient} from '@sanity/client'
import {CommentPostPayload} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface CommentsSetupContextValue {
  client: SanityClient | null
  isRunningSetup: boolean
  runSetup: (comment: CommentPostPayload) => Promise<void>
}
