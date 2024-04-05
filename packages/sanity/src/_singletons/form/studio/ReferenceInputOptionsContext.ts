import {createContext} from 'react'
import type {ReferenceInputOptions} from 'sanity'

/**
 * @internal
 */
export const ReferenceInputOptionsContext = createContext<ReferenceInputOptions>({})
