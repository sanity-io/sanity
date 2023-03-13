import {MouseEvent, ReactNode} from 'react'
import {ScrollToOptions, VirtualItem} from '@tanstack/react-virtual'
import {ResponsivePaddingProps} from '@sanity/ui'

/**
 * @internal
 */
export interface CommandListVirtualItemValue<T> {
  disabled?: boolean
  selected?: boolean
  value: T
}

/**
 * @internal
 */
export interface CommandListVirtualItemProps<T> extends CommandListVirtualItemValue<T> {
  /** DOM element index (what's visible in the browser) */
  index: number
  /** Virtualized element index */
  virtualIndex: number
}

/**
 * @internal
 */
export interface CommandListHandle {
  focusElement: () => void
  getTopIndex: () => number
  scrollToIndex: (index: number) => void
}

/**
 * @internal
 */
export interface CommandListItemProps {
  activeIndex: number
  children: ReactNode
  fixedHeight?: boolean
  measure?: (node: Element | null) => void
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  virtualRow: VirtualItem
}

/**
 * @internal
 */
export interface CommandListProps<T> extends ResponsivePaddingProps {
  /** The data attribute to apply to any active virtual list items */
  activeItemDataAttr?: string
  /** `aria-label` to apply to the virtual list container element */
  ariaLabel: string
  /** Whether `aria-multiselectable` is enabled on the virtual list container element */
  ariaMultiselectable?: boolean
  /** Automatically focus the input (if applicable) or virtual list */
  autoFocus?: boolean
  getItemKey?: (index: number) => number | string
  /** Force a fixed height for all virtual list children and skip measurement (faster). */
  fixedHeight?: boolean
  /** Scroll alignment of the initial active index */
  initialScrollAlign?: ScrollToOptions['align']
  /** Initial active index on mount */
  initialIndex?: number
  inputElement?: HTMLElement | null
  itemHeight: number
  overscan?: number
  /** Rendered component in virtual lists */
  renderItem: (props: CommandListVirtualItemProps<any>) => ReactNode
  /** Virtual list item values, accessible to all rendered item components */
  values: CommandListVirtualItemValue<T>[]
}
