import {createContext} from 'react'

import type {ZIndexContextValue} from '../../../../core/components/zOffsets/types'
import {zIndexContextDefaults} from './zIndexContextDefaults'

/**
 * TODO: Rename to `ZOffsetsContext`
 *
 * @internal
 */
export const ZIndexContext = createContext<ZIndexContextValue>(zIndexContextDefaults)
