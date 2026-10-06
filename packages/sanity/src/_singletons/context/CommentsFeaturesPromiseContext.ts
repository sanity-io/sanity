import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The comments feature check as a promise for `use()`, provided by the `CommentsStudioProvider` of
 * whichever comments plugin is active (only one of the two is registered at a time).
 * @internal
 */
export const CommentsFeaturesPromiseContext =
  createContext<ObservablePromise<SettledFeatures> | null>(
    'sanity/_singletons/context/comments-features-promise',
    null,
  )
