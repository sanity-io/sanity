import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {ReferenceInputOptions} from '../../core/form/studio/contexts/ReferenceInputOptions'

/**
 * @internal
 */
export const ReferenceInputOptionsContext: Context<ReferenceInputOptions> =
  createContext<ReferenceInputOptions>('sanity/_singletons/context/reference-input-options', {})
