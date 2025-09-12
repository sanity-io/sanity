import {createContext} from 'sanity/_createContext'

import type {RawPerspectiveContextValue} from '../../core/perspective/types'

/**
 * @internal
 * Context for raw, unmapped perspective values.
 * This is used internally by DocumentPerspectiveProvider to access
 * the original perspective values before cardinality one mapping.
 */
export const RawPerspectiveContext = createContext<RawPerspectiveContextValue | null>(
  'sanity/_singletons/context/RawPerspectiveContext',
  null,
)
