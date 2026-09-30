import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'
import {missingProviderPromise} from './missingProviderPromise'

/**
 * The comments feature check as a promise for `use()`. `CommentsStudioProvider` starts it above
 * the studio's loading screen boundary (`studio.components.provider`); `CommentsStudioLayout` and
 * `useResolveCommentsEnabled` read it below with `use(use(CommentsFeaturesPromiseContext))`,
 * so the upsell wrapping and the per-document comments state are settled before they render.
 *
 * @internal
 */
export const CommentsFeaturesPromiseContext = createContext<ObservablePromise<SettledFeatures>>(
  'sanity/_singletons/context/comments-features-promise',
  missingProviderPromise('CommentsFeaturesPromiseContext', 'CommentsStudioProvider'),
)
