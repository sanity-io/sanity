/* eslint-disable import/no-duplicates */
import type {MutableRefObject} from 'react'
import {createContext} from 'react'

/**
 * @internal
 */
export interface ReferenceItemRef {
  menuRef: MutableRefObject<HTMLDivElement | null>
  containerRef: MutableRefObject<HTMLDivElement | null>
}

/**
 * This is a way to store ref of the menu as well as the container of the ReferenceItem
 * so it can be used down the tree for clickOutside handling
 * @internal
 */
export const ReferenceItemRefContext = createContext<ReferenceItemRef | null>(null)
