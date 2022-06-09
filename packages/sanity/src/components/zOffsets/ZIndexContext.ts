import {createContext} from 'react'
import {ZIndexContextValue} from './types'
import {defaults} from './defaults'

/**
 * @todo: Rename to `ZOffsetsContext`
 *
 * @internal
 */
export const ZIndexContext = createContext<ZIndexContextValue>(defaults)
