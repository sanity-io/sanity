import {createContext} from 'react'

import type {PaneLayoutContextValue} from '../../../../structure/components/pane/types'

/**
 * @internal
 */
export const PaneLayoutContext = createContext<PaneLayoutContextValue | null>(null)
