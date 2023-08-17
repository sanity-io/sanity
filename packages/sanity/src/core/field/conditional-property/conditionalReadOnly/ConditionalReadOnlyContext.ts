import {createContext} from 'react'
import {ConditionalReadOnlyContextValue} from './types'

/**
 * @internal
 */
export const ConditionalReadOnlyContext = createContext<ConditionalReadOnlyContextValue | null>(
  null,
)
