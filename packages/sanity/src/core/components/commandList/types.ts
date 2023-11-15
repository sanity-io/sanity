import {ResponsivePaddingProps} from '@sanity/ui'
import {ScrollToOptions} from '@tanstack/react-virtual'
import {ReactNode} from 'react'

/** @internal */
export type CommandListElementType = 'input' | 'list'

/** @internal */
export type CommandListGetItemDisabledCallback = (virtualIndex: number) => boolean

/** @internal */
export type CommandListGetItemKeyCallback = (virtualIndex: number) => number | string

/** @internal */
export type CommandListGetItemSelectedCallback = (virtualIndex: number) => boolean

/** @internal */
export type CommandListItemContext = {
  activeIndex: number | null
  disabled?: boolean
  selected?: boolean
  virtualIndex: number
}

/** @internal */
export type CommandListRenderItemCallback<T> = (
  item: T,
  context: CommandListItemContext,
) => ReactNode

/** @internal */
export interface CommandListHandle {
  focusInputElement: () => void
  focusListElement: () => void
  getTopIndex: () => number
  scrollToIndex: (index: number) => void
}

/** @internal */
export interface CommandListProps<T = any> extends ResponsivePaddingProps {
  /** The data attribute to apply to any active virtual list items */
  activeItemDataAttr?: string
  /** `aria-label` to apply to the virtual list container element */
  ariaLabel: string
  /** Whether `aria-multiselectable` is enabled on the virtual list container element */
  ariaMultiselectable?: boolean
  /** Automatically focus the input or virtual list */
  autoFocus?: CommandListElementType
  /** Whether the virtual list can receive focus */
  canReceiveFocus?: boolean
  /** Pixel offset of the virtual list focus ring. Negative values will cause the focus ring to appear inset */
  focusRingOffset?: number
  /** Force a fixed height for all virtual list children and skip measurement (faster). */
  fixedHeight?: boolean
  /** Custom function to map disabled items */
  getItemDisabled?: CommandListGetItemDisabledCallback
  /** Custom function to map virtual list items to custom keys */
  getItemKey?: CommandListGetItemKeyCallback
  /** Custom function to map selected items */
  getItemSelected?: CommandListGetItemSelectedCallback
  /** Scroll alignment of the initial active index */
  initialScrollAlign?: ScrollToOptions['align']
  /** Initial active index on mount */
  initialIndex?: number
  /** Input element to associate with this virtual list. Associated inputs will receive focus and handle key events */
  inputElement?: HTMLInputElement | null
  /** Estimated height for each list item */
  itemHeight: number
  /** Virtual list item values, accessible to all rendered item components */
  items: T[]
  /** Callback fired when the virtual list is within `onEndReachedIndexThreshold` of rendered content */
  onEndReached?: () => void
  /** Number of items from the end of the virtual list before which `onEndReached` is triggered */
  onEndReachedIndexOffset?: number
  /**
   * Callback fired when the virtual list scroll element has rendered
   * TODO: consider changing to `onReady` and passing the virtualizer instance? What constitutes "ready" in this case?
   */
  onListReady?: (virtualListElement: HTMLElement) => void
  /** Only show selection state when the virtual list is active (is hovered or has focus) */
  onlyShowSelectionWhenActive?: boolean
  /** Number of items to render above and below the visible area*/
  overscan?: number
  /** Rendered component in virtual lists */
  renderItem: CommandListRenderItemCallback<T>
  /** Allow wraparound keyboard navigation between first and last items */
  wrapAround?: boolean
}
