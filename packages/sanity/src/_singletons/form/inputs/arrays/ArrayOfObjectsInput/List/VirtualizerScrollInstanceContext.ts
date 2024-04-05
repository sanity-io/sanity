import {createContext} from 'react'
import type {VirtualizerScrollInstance} from 'sanity'

/**
 * This is used to store the reference to the scroll element for virtualizer
 * @internal
 */
export const VirtualizerScrollInstanceContext = createContext<VirtualizerScrollInstance | null>(
  null,
)
