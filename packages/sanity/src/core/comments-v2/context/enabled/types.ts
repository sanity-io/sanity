import {type CommentsUIMode} from '../../types'

export type CommentsEnabledContextValue =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: CommentsUIMode
    }

/**
 * `'default'` when the plan has the comments feature, `'upsell'` when it does not, `null` when
 * the feature check failed.
 * @internal
 */
export type CommentsMode = CommentsUIMode | null
