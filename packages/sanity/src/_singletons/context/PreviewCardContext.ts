import type {PreviewCardContextValue} from '../../core/components/previewCard/PreviewCard'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PreviewCardContext = createContext<PreviewCardContextValue>(
  'sanity/_singletons/context/preview-card',
  {
    selected: false,
  },
)
