import {type ComponentType, useContext} from 'react'
import {SanityCreateConfigContext} from 'sanity/_singletons'

import {type AppIdCache} from '../studio-app/appIdCache'
import {
  type CreateLinkedActionsProps,
  type CreateLinkedDocumentBannerContentProps,
  type StartInCreateBannerProps,
} from '../types'

/**
 * @internal
 */
export interface SanityCreateConfigContextValue {
  /**
   * A boolean indicating whether "Start in Create" new document pane footer should be shown, when available.
   */
  startInCreateEnabled: boolean

  fallbackStudioOrigin?: string

  appIdCache?: AppIdCache

  components?: {
    documentLinkedBannerContent: ComponentType<CreateLinkedDocumentBannerContentProps> | undefined
    documentLinkedActions: ComponentType<CreateLinkedActionsProps> | undefined
    startInCreateBanner: ComponentType<StartInCreateBannerProps> | undefined
  }
}

/**
 * @internal
 */
export function useSanityCreateConfig(): SanityCreateConfigContextValue {
  const context = useContext(SanityCreateConfigContext)
  if (!context) {
    throw new Error('useSanityCreateConfig must be used within a SanityCreateConfigProvider')
  }
  return context
}
