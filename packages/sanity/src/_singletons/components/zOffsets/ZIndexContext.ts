import {createContext} from 'react'
import type {ZIndexContextValue} from 'sanity'

import {zIndexContextDefaults} from './zIndexContextDefaults'

/**
 * TODO: Rename to `ZOffsetsContext`
 *
 * @internal
 */
export const ZIndexContext = createContext<ZIndexContextValue>(zIndexContextDefaults)
