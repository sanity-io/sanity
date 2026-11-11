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
 * the field waits two frames to take the focus after that. Arrow keys typed in the field still
 * reach the menu, which moves its active item and focus from there.
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

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) focusAfterMenuSettles()
          })
        : undefined
    observer?.observe(element)

    return () => {
      observer?.disconnect()
      cancelPending()
    }
  }, [])
}
