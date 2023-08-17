import {Box, rem, Theme} from '@sanity/ui'
import {ScrollToOptions, useVirtualizer, Virtualizer} from '@tanstack/react-virtual'
import throttle from 'lodash/throttle'
import React, {
  cloneElement,
  forwardRef,
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled, {css} from 'styled-components'
import {focusRingStyle} from '../../form/components/formField/styles'
import {CommandListElementType, CommandListHandle, CommandListProps} from './types'

// Data attribute to assign to the current active virtual list element
const LIST_ITEM_DATA_ATTR_ACTIVE = 'data-active'
// Selector to find the first interactive element in the virtual list element
const LIST_ITEM_INTERACTIVE_SELECTOR = 'a,button'

/**
 * Conditionally render a focus ring overlay over the command list, with adjustable offset
 */
const FocusOverlayDiv = styled.div(({theme, offset}: {theme: Theme; offset: number}) => {
  return css`
    bottom: ${-offset}px;
    border-radius: ${rem(theme.sanity.radius[1])};
    left: ${-offset}px;
    pointer-events: none;
    position: absolute;
    right: ${-offset}px;
    top: ${-offset}px;
    z-index: 2;

    ${VirtualListBox}:focus-visible & {
      box-shadow: ${focusRingStyle({
        base: theme.sanity.color.base,
        focusRing: theme.sanity.focusRing,
      })};
    }
  `
})

/*
 * Conditionally appears over command list items to cancel existing :hover states for all child elements.
 * It should only appear if hover capabilities are available (not on touch devices)
 */
const PointerOverlayDiv = styled.div`
  bottom: 0;
  display: none;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;

  @media (hover: hover) {
    &[data-enabled='true'] {
      display: block;
    }
  }
`

const VirtualListBox = styled(Box)`
  height: 100%;
  outline: none;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  width: 100%;
`

type VirtualListChildBoxProps = {
  $height: number
}
const VirtualListChildBox = styled(Box) //
  .attrs<VirtualListChildBoxProps>(({$height}) => ({
    style: {height: `${$height}px`},
  }))<VirtualListChildBoxProps>`
  position: relative;
  width: 100%;
`

/**
 * Renders a Command List with support for the following:
 *
 * - Keyboard navigation (↑ / ↓ / ENTER) to children with a specified container (`childContainerRef`)
 * - Focus redirection when clicking child elements
 * - Pointer blocking when navigating with arrow keys (to ensure that only one active state is visible at any given time)
 * - ARIA attributes to define a `combobox` input that controls a separate `listbox`
 *
 * @internal
 */
export const CommandList = forwardRef<CommandListHandle, CommandListProps>(function CommandList(
  {
    activeItemDataAttr = LIST_ITEM_DATA_ATTR_ACTIVE,
    ariaLabel,
    ariaMultiselectable = false,
    autoFocus,
    canReceiveFocus,
    fixedHeight,
    focusRingOffset = 0,
    getItemDisabled,
    getItemKey,
    getItemSelected,
    initialIndex,
    initialScrollAlign = 'start',
    inputElement,
    itemHeight,
    items,
    onEndReached,
    onEndReachedIndexOffset = 0,
    onlyShowSelectionWhenActive,
    overscan,
    renderItem,
    wrapAround = true,
    ...responsivePaddingProps
  },
  ref,
) {
  const isMountedRef = useRef(false)
  const commandListId = useRef(useId())
  const activeIndexRef = useRef(initialIndex ?? 0)

  const [childContainerElement, setChildContainerElement] = useState<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const [pointerOverlayElement, setPointerOverlayElement] = useState<HTMLDivElement | null>(null)
  const [virtualListElement, setVirtualListElement] = useState<HTMLDivElement | null>(null)

  const handleChange = useCallback(
    (v: Virtualizer<HTMLDivElement, Element>) => {
      if (!onEndReached) return

      const [lastItem] = [...v.getVirtualItems()].reverse()

      if (!lastItem) return

      const reachedEnd = lastItem.index >= items.length - onEndReachedIndexOffset - 1

      // Make sure we only trigger `onEndReached` after initial mount
      if (reachedEnd && isMountedRef.current) {
        onEndReached()
      }
    },
    [onEndReached, items.length, onEndReachedIndexOffset],
  )

  // This will trigger a re-render whenever its internal state changes
  const virtualizer = useVirtualizer({
    count: items.length,
    getItemKey,
    getScrollElement: () => virtualListElement,
    estimateSize: () => itemHeight,
    onChange: handleChange,
    overscan,
  })

  /**
   * Return an array of values with `activeIndex`, `disabled` and `selected` defined, applying custom
   * mapping functions (`getItemDisabled`, `getItemSelected`) if provided. E.g.:
   *
   * ```
   * [
   *  { activeIndex: 0  disabled: false, selected: false },
   *  { activeIndex: null, disabled: true, selected: false },
   *  { activeIndex: 1, disabled: false, selected: true }
   * ]
   * ```
   *
   * Disabled virtual list items are ignored when creating aria attributes.
   */
  const itemIndices = useMemo(() => {
    let i = -1
    return items.reduce<
      {
        activeIndex: number | null
        selected: boolean
        disabled: boolean
      }[]
    >((acc, _, index) => {
      const disabled = getItemDisabled?.(index) ?? false
      const selected = getItemSelected?.(index) ?? false
      if (!disabled) {
        i += 1
      }
      acc[index] = {
        activeIndex: disabled ? null : i,
        disabled,
        selected,
      }
      return acc
    }, [])
  }, [getItemDisabled, getItemSelected, items])

  const activeItemCount = useMemo(
    () => itemIndices.filter((v) => !v.disabled).length,
    [itemIndices],
  )

  /**
   * Toggle pointer overlay element which will kill existing hover states
   */
  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) =>
      pointerOverlayElement?.setAttribute('data-enabled', (!enabled).toString()),
    [pointerOverlayElement],
  )

  const getChildDescendantId = useCallback(
    (index: number) => `${commandListId.current}-item-${index}`,
    [],
  )

  const getCommandListChildrenId = useCallback(() => `${commandListId.current}-children`, [])

  /**
   * Iterate through all virtual list children and apply the active data-attribute on the selected index.
   * Don't apply styles when `hideSelectionOnMouseLeave` is true and the command list is neither focused or hovered.
   */
  const showChildrenActiveState = useCallback(() => {
    const hasFocus = [inputElement, virtualListElement].some((el) => document.activeElement === el)
    if (onlyShowSelectionWhenActive && !hasFocus && !hovered) {
      return
    }

    const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
    childElements?.forEach((child) => {
      const virtualIndex = Number(child.dataset?.index)
      const targetIndex = itemIndices[virtualIndex]?.activeIndex
      child
        .querySelector(LIST_ITEM_INTERACTIVE_SELECTOR)
        ?.toggleAttribute(activeItemDataAttr, targetIndex === activeIndexRef.current)
    })
  }, [
    activeItemDataAttr,
    childContainerElement?.children,
    hovered,
    inputElement,
    itemIndices,
    onlyShowSelectionWhenActive,
    virtualListElement,
  ])

  /**
   * Iterate through all virtual list children and clear the active data-attribute.
   */
  const hideChildrenActiveState = useCallback(() => {
    const childElements = Array.from(childContainerElement?.children || [])
    childElements?.forEach((child) => {
      child
        .querySelector(LIST_ITEM_INTERACTIVE_SELECTOR)
        ?.toggleAttribute(activeItemDataAttr, false)
    })
  }, [activeItemDataAttr, childContainerElement?.children])

  /**
   * Throttled version of `showChildrenActiveState`, used when DOM mutations are detected in virtual lists
   */
  const refreshChildrenActiveStateThrottled = useMemo(() => {
    return throttle(showChildrenActiveState, 200)
  }, [showChildrenActiveState])

  /**
   * Assign active descendant on input element (if present)
   */
  const handleUpdateActiveDescendant = useCallback(() => {
    const activeIndex = activeIndexRef?.current
    if (items.length > 0) {
      inputElement?.setAttribute('aria-activedescendant', getChildDescendantId(activeIndex))
      virtualListElement?.setAttribute('aria-activedescendant', getChildDescendantId(activeIndex))
    } else {
      inputElement?.removeAttribute('aria-activedescendant')
      virtualListElement?.removeAttribute('aria-activedescendant')
    }
  }, [getChildDescendantId, inputElement, items.length, virtualListElement])

  /**
   * Obtain index of the top most visible element
   */
  const handleGetTopIndex = useCallback(() => {
    const childContainerParentElement = childContainerElement?.parentElement
    if (childContainerElement && childContainerParentElement) {
      const offset =
        childContainerParentElement.getBoundingClientRect().top -
        childContainerElement.getBoundingClientRect().top
      return virtualizer.getVirtualItemForOffset(offset)?.index ?? -1
    }
    return -1
  }, [childContainerElement, virtualizer])

  /**
   * Mark an index as active, re-assign aria attrs on all children and optionally scroll into view
   */
  const setActiveIndex = useCallback(
    ({
      index,
      scrollAlign,
      scrollIntoView = true,
    }: {
      index: number
      scrollAlign?: ScrollToOptions['align']
      scrollIntoView?: boolean
    }) => {
      activeIndexRef.current = index
      handleUpdateActiveDescendant()
      showChildrenActiveState()

      if (scrollIntoView) {
        const virtualListIndex = itemIndices.findIndex((i) => i.activeIndex === index)
        if (virtualListIndex > -1) {
          virtualizer.scrollToIndex(virtualListIndex, scrollAlign ? {align: scrollAlign} : {})
        }
      }
    },
    [handleUpdateActiveDescendant, itemIndices, showChildrenActiveState, virtualizer],
  )

  /**
   * Select adjacent virtual item index and scroll into view with `react-virtual`
   */
  const selectAdjacentItemIndex = useCallback(
    (direction: 'previous' | 'next') => {
      let nextIndex = -1
      const lastIndex = activeItemCount - 1

      if (direction === 'next') {
        const wrapAroundIndex = wrapAround ? 0 : lastIndex
        nextIndex =
          activeIndexRef.current < activeItemCount - 1
            ? activeIndexRef.current + 1
            : wrapAroundIndex
      }
      if (direction === 'previous') {
        const wrapAroundIndex = wrapAround ? lastIndex : 0
        nextIndex = activeIndexRef.current > 0 ? activeIndexRef.current - 1 : wrapAroundIndex
      }
      setActiveIndex({index: nextIndex, scrollIntoView: true})
      enableChildContainerPointerEvents(false)
    },
    [activeItemCount, enableChildContainerPointerEvents, setActiveIndex, wrapAround],
  )

  const focusElement = useCallback(
    (type: CommandListElementType) => {
      switch (type) {
        case 'input':
          inputElement?.focus()
          break
        case 'list':
          virtualListElement?.focus()
          break
        default:
          break
      }
    },
    [inputElement, virtualListElement],
  )

  const focusInputElement = useCallback(() => {
    inputElement?.focus()
  }, [inputElement])

  const focusListElement = useCallback(() => {
    virtualListElement?.focus()
  }, [virtualListElement])

  /**
   * Mark hovered child item as active
   */
  const handleChildMouseEnter = useCallback(
    (index: number) => () => {
      setActiveIndex({index, scrollIntoView: false})
    },
    [setActiveIndex],
  )

  const handleFocus = useCallback(() => {
    showChildrenActiveState()
  }, [showChildrenActiveState])

  /**
   * Handle keyboard events:
   * - Up/down arrow: scroll to adjacent items
   * - Enter: trigger click events on the current active element
   */
  const handleKeyDown = useCallback(
    (type: CommandListElementType) => (event: KeyboardEvent) => {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      if (!childElements.length) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        focusElement(type)
        selectAdjacentItemIndex('next')
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        focusElement(type)
        selectAdjacentItemIndex('previous')
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        focusElement(type)
        const currentElement = childElements.find(
          (el) =>
            Number(el.dataset.index) ===
            itemIndices.findIndex((i) => i.activeIndex === activeIndexRef.current),
        )

        if (currentElement) {
          const clickableElement = currentElement?.querySelector<HTMLElement>(
            LIST_ITEM_INTERACTIVE_SELECTOR,
          )
          clickableElement?.click()
        }
      }
    },
    [childContainerElement?.children, focusElement, itemIndices, selectAdjacentItemIndex],
  )
  const handleKeyDownInput = useCallback(
    (event: KeyboardEvent) => handleKeyDown('input')(event),
    [handleKeyDown],
  )
  const handleKeyDownList = useCallback(
    (event: KeyboardEvent) => handleKeyDown('list')(event),
    [handleKeyDown],
  )

  const handleVirtualListMouseEnter = useCallback(() => {
    if (onlyShowSelectionWhenActive) {
      showChildrenActiveState()
      setHovered(true)
    }
  }, [onlyShowSelectionWhenActive, showChildrenActiveState])
  const handleVirtualListMouseLeave = useCallback(() => {
    if (onlyShowSelectionWhenActive) {
      hideChildrenActiveState()
      setHovered(false)
    }
  }, [hideChildrenActiveState, onlyShowSelectionWhenActive])

  useImperativeHandle(
    ref,
    () => {
      return {
        focusInputElement() {
          focusInputElement()
        },
        focusListElement() {
          focusListElement()
        },
        getTopIndex() {
          return handleGetTopIndex()
        },
        scrollToIndex(index: number) {
          setActiveIndex({index})
          enableChildContainerPointerEvents(true)
        },
      }
    },
    [
      enableChildContainerPointerEvents,
      focusInputElement,
      focusListElement,
      handleGetTopIndex,
      setActiveIndex,
    ],
  )

  /**
   * Optionally set active index (and align) on mount only
   */
  useEffect(() => {
    if (typeof initialIndex !== 'undefined' && !isMountedRef.current) {
      setActiveIndex({
        index: initialIndex,
        scrollAlign: initialScrollAlign,
        scrollIntoView: true,
      })
    }
    isMountedRef.current = true
  }, [initialIndex, initialScrollAlign, onlyShowSelectionWhenActive, setActiveIndex])

  /**
   * Re-enable child pointer events on any mousemove / wheel event
   */
  useEffect(() => {
    function handleMouseEvent() {
      enableChildContainerPointerEvents(true)
    }
    virtualListElement?.addEventListener('mousemove', handleMouseEvent)
    virtualListElement?.addEventListener('wheel', handleMouseEvent, {passive: true})
    return () => {
      virtualListElement?.removeEventListener('mousemove', handleMouseEvent)
      virtualListElement?.removeEventListener('wheel', handleMouseEvent)
    }
  }, [enableChildContainerPointerEvents, virtualListElement])

  /**
   * Listen to keyboard / blur / focus events on both input element (if present) and the virtual list element.
   */
  useEffect(() => {
    inputElement?.addEventListener('focus', handleFocus)
    inputElement?.addEventListener('keydown', handleKeyDownInput)
    virtualListElement?.addEventListener('focus', handleFocus)
    virtualListElement?.addEventListener('keydown', handleKeyDownList)
    return () => {
      inputElement?.removeEventListener('focus', handleFocus)
      inputElement?.removeEventListener('keydown', handleKeyDownInput)
      virtualListElement?.removeEventListener('focus', handleFocus)
      virtualListElement?.removeEventListener('keydown', handleKeyDownList)
    }
  }, [
    canReceiveFocus,
    handleFocus,
    handleKeyDown,
    handleKeyDownInput,
    handleKeyDownList,
    hideChildrenActiveState,
    inputElement,
    showChildrenActiveState,
    virtualListElement,
  ])

  /**
   * Refresh selected state when item values change (as a result of filtering).
   * This is to ensure that we correctly clear aria-activedescendant attrs if the filtered array is empty.
   */
  useEffect(() => {
    handleUpdateActiveDescendant()
  }, [handleUpdateActiveDescendant, items])

  /**
   * On DOM mutations, re-assign active descendant on input element (if present) and update active state on all children.
   *
   * Useful since virtual lists will constantly mutate the DOM on scroll, and we want to ensure that
   * new elements coming into view are rendered with the correct selected state.
   *
   * An alternative to using MutationObserver is hooking into the `onChange` callback that `react-virtual` provides, though
   * this changes on _every_ internal state change.
   */
  useEffect(() => {
    const mutationObserver = new MutationObserver(refreshChildrenActiveStateThrottled)

    if (childContainerElement) {
      mutationObserver.observe(childContainerElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [childContainerElement, refreshChildrenActiveStateThrottled])

  /**
   * Apply input aria attributes
   */
  useEffect(() => {
    inputElement?.setAttribute('aria-autocomplete', 'list')
    inputElement?.setAttribute('aria-expanded', 'true')
    inputElement?.setAttribute('aria-controls', getCommandListChildrenId())
    inputElement?.setAttribute('role', 'combobox')
  }, [getCommandListChildrenId, inputElement])

  /**
   * Focus input / virtual list element on mount
   */
  useEffect(() => {
    if (autoFocus) {
      focusElement(autoFocus)
    }
  }, [autoFocus, canReceiveFocus, focusListElement, focusInputElement, focusElement])

  const rootTabIndex = canReceiveFocus ? 0 : -1

  return (
    <VirtualListBox
      id={getCommandListChildrenId()}
      onMouseEnter={handleVirtualListMouseEnter}
      onMouseLeave={handleVirtualListMouseLeave}
      ref={setVirtualListElement}
      sizing="border"
      tabIndex={rootTabIndex}
      {...responsivePaddingProps}
    >
      {canReceiveFocus && <FocusOverlayDiv offset={focusRingOffset} />}
      <PointerOverlayDiv aria-hidden="true" data-enabled ref={setPointerOverlayElement} />
      {virtualizer && (
        <VirtualListChildBox
          $height={virtualizer.getTotalSize()}
          aria-label={ariaLabel}
          aria-multiselectable={ariaMultiselectable}
          flex={1}
          ref={setChildContainerElement}
          role="listbox"
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const virtualIndex = virtualRow.index // visible index in the DOM
            const {activeIndex, disabled, selected} = itemIndices[virtualIndex]

            const itemToRender = renderItem(items[virtualIndex], {
              activeIndex,
              disabled,
              selected,
              virtualIndex,
            }) as ReactElement

            const clonedItem = cloneElement(itemToRender, {
              tabIndex: -1,
            })

            const activeAriaAttributes =
              typeof activeIndex === 'number' && !disabled
                ? {
                    'aria-posinset': activeIndex + 1,
                    ...(ariaMultiselectable ? {'aria-selected': selected.toString()} : {}),
                    'aria-setsize': activeItemCount,
                    id: getChildDescendantId(activeIndex),
                    role: 'option',
                    onMouseEnter: handleChildMouseEnter(activeIndex),
                  }
                : {}

            return (
              <div
                data-index={virtualIndex}
                key={virtualRow.key}
                ref={fixedHeight ? undefined : virtualizer.measureElement}
                style={{
                  flex: 1,
                  ...(fixedHeight ? {height: `${virtualRow.size}px`} : {}),
                  left: 0,
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%',
                }}
                tabIndex={-1}
                {...activeAriaAttributes}
              >
                {clonedItem}
              </div>
            )
          })}
        </VirtualListChildBox>
      )}
    </VirtualListBox>
  )
})
