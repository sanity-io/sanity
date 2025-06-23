import {createContext} from 'sanity/_createContext'

import type {PreviewCardContextValue} from '../../core/components/previewCard/PreviewCard'

/**
 * @internal
 */
export const PreviewCardContext: React.Context<PreviewCardContextValue> =
  createContext<PreviewCardContextValue>('sanity/_singletons/context/preview-card', {
    selected: false,
  })
