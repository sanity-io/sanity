import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'
import {missingProviderPromise} from './missingProviderPromise'

/**
 * The comments feature check as a promise for `use()`. `CommentsStudioProvider` starts it above
 * the studio's loading screen boundary (`studio.components.provider`); `CommentsStudioLayout` and
 * `useResolveCommentsEnabled` read it below with `use(use(CommentsFeaturesPromiseContextV2))`,
 * so the upsell wrapping and the per-document comments state are settled before they render.
 *
 * @internal
 */
export const CommentsFeaturesPromiseContextV2 = createContext<ObservablePromise<SettledFeatures>>(
  'sanity/_singletons/context/comments-features-promise-v2',
  missingProviderPromise('CommentsFeaturesPromiseContextV2', 'CommentsStudioProvider'),
)
