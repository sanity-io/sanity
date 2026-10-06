import {type CommentsUIMode} from '../../types'

/**
 * `'default'` when the plan has the comments feature, `'upsell'` when it does not, `null` when
 * the feature check failed.
 * @internal
 */
export type CommentsMode = CommentsUIMode | null
