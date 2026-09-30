import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The comments feature check as a promise for `use()`. `CommentsStudioProviders` starts it above
 * the studio's loading screen boundary (`studio.components.providers`) and `CommentsStudioLayout`
 * reads it below, so whether the upsell provider wraps the layout is decided before it renders.
 * `null` outside the plugin.
 *
 * @internal
 */
export const CommentsFeaturesPromiseContextV2 =
  createContext<ObservablePromise<SettledFeatures> | null>(
    'sanity/_singletons/context/comments-features-promise-v2',
    null,
  )
