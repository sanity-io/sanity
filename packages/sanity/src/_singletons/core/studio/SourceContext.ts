import {createContext} from 'react'

import type {Source} from '../../../core/config/types'

/**
 * @internal
 */
export const SourceContext = createContext<Source | null>(null)
