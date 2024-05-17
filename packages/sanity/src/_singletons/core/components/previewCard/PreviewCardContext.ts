import {createContext} from 'react'

import type {PreviewCardContextValue} from '../../../../core/components/previewCard/PreviewCard'

/**
 * @internal
 */
export const PreviewCardContext = createContext<PreviewCardContextValue>({selected: false})
