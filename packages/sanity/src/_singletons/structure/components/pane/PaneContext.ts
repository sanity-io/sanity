import {createContext} from 'react'

import type {PaneContextValue} from '../../../../structure/components/pane/types'

/**
 * @internal
 */
export const PaneContext = createContext<PaneContextValue | null>(null)
