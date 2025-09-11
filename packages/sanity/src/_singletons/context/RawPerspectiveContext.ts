import {createContext} from 'react'

import type {PerspectiveContextValue} from '../../core/perspective/types'

/**
 * @internal
 * Context for raw, unmapped perspective values.
 * This is used internally by DocumentPerspectiveProvider to access
 * the original perspective values before cardinality one mapping.
 */
export const RawPerspectiveContext = createContext<PerspectiveContextValue | null>(null)
