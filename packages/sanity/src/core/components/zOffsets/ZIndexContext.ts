import {createContext} from 'react'

import {defaults} from './defaults'
import {type ZIndexContextValue} from './types'

/**
 * TODO: Rename to `ZOffsetsContext`
 *
 * @internal
 */
export const ZIndexContext = createContext<ZIndexContextValue>(defaults)
