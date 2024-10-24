import {type ComponentType, useContext} from 'react'
import {SanityCreateConfigContext} from 'sanity/_singletons'

import {type CreateLinkedActionsProps, type CreateLinkedDocumentBannerContentProps} from '../types'

/**
 * @internal
 */
export interface SanityCreateConfigContextValue {
  /**
   * A boolean indicating whether "Start in Create" new document pane footer should be shown, when available.
   */
  startInCreateEnabled: boolean

  fallbackStudioOrigin?: string

  components?: {
    documentLinkedBannerContent?: ComponentType<CreateLinkedDocumentBannerContentProps>
    documentLinkedActions?: ComponentType<CreateLinkedActionsProps>
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
