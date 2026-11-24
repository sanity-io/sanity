import {useCallback} from 'react'

/**
 * A touch device opens its on-screen keyboard when a text field takes focus, which would cover the
 * menu's list (the navigation drawer shows these menus on phones). Only a fine pointer with hover,
 * a mouse or trackpad with a physical keyboard, focuses the field.
 */
function canFocusSearchField(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/**
 * Ref callback for the search field of a navbar perspective menu: focuses the field when the menu
 * opens, so the user can type straight away.
 *
 * The menu focuses its selected item one animation frame after it mounts (`useMenuController`), so
 * the field waits two frames to take the focus after that.
 *
 * Arrow keys typed in the field move into the list from its ends: ArrowDown to the first row,
 * ArrowUp to the last. The menu moves from its active item, which is still the item it focused on
 * open (the first or the selected row) after the field took the focus, so ArrowDown would skip
 * a row. The field hands the menu End then ArrowDown (or Home then ArrowUp), which wrap to the end
 * of the list it should start from.
 *
 * `@sanity/ui` keeps a menu mounted, hidden with `display: none`, after its first open, so the ref
 * callback does not run again when the menu reopens. An `IntersectionObserver` covers that: each
 * time the hidden field becomes visible again, it takes the focus the same way. A field that is
 * mounted while the menu is still closed cannot take the focus, because it is not rendered.
 */
export function useFocusSearchOnOpen(): (element: HTMLInputElement | null) => (() => void) | void {
  return useCallback((element: HTMLInputElement | null) => {
    if (!element || !canFocusSearchField()) return undefined

    let firstFrame: number | undefined
    let secondFrame: number | undefined
    const cancelPending = () => {
      if (firstFrame !== undefined) cancelAnimationFrame(firstFrame)
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame)
    }
    const focusAfterMenuSettles = () => {
      cancelPending()
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => element.focus({preventScroll: true}))
      })
    }

    focusAfterMenuSettles()

    let forwarding = false
    const forward = (key: string) => {
      element.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}))
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (forwarding || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      event.stopPropagation()
      forwarding = true
      forward(event.key === 'ArrowDown' ? 'End' : 'Home')
      forward(event.key)
      forwarding = false
      // When the menu's active item already was that end row, the two keys leave its state
      // unchanged and the menu does not move the focus: the field then hands it over itself, once
      // the menu has had its frame to focus.
      const toFirst = event.key === 'ArrowDown'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (element.ownerDocument.activeElement !== element) return
          const items = [
            ...(element
              .closest('[data-ui="Menu"]')
              ?.querySelectorAll<HTMLElement>(
                '[data-ui="MenuItem"]:not([disabled]):not([data-disabled="true"])',
              ) ?? []),
          ]
          items[toFirst ? 0 : items.length - 1]?.focus()
        })
      })
    }
    element.addEventListener('keydown', handleKeyDown)

    // Only a change from hidden to visible is an open. The observer also reports the starting state
    // and repeated visible states, and a focus scheduled by those could land after the menu closed.
    let wasVisible = false
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting)
            if (visible && !wasVisible) focusAfterMenuSettles()
            if (!visible) cancelPending()
            wasVisible = visible
          })
        : undefined
    observer?.observe(element)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
      observer?.disconnect()
      cancelPending()
    }
  }, [])
}
