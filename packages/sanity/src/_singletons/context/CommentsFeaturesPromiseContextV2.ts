import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The comments feature check as a promise for `use()`, provided by `CommentsStudioProvider`.
 * @internal
 */
export const CommentsFeaturesPromiseContextV2 =
  createContext<ObservablePromise<SettledFeatures> | null>(
    'sanity/_singletons/context/comments-features-promise-v2',
    null,
  )
