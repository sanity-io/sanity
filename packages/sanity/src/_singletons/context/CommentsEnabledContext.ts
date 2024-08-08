import {createContext} from 'sanity/_createContext'

import type {CommentsEnabledContextValue} from '../../core/comments/context/enabled/types'

// NOTE: We initialize this context with a default value (`enabled: false`)
// rather than `null` to handle cases where the comments feature's availability
// isn't explicitly provided by a surrounding provider component. Typically,
// comments functionality is included by default in all new studio
// configurations. Therefore, in the absence of a specific provider
// (CommentsEnabledProvider), we assume that the feature is disabled.
/**
 * @internal
 */
export const CommentsEnabledContext = createContext<CommentsEnabledContextValue>(
  'sanity/_singletons/context/comments-enabled',
  {
    enabled: false,
    mode: null,
  },
)
