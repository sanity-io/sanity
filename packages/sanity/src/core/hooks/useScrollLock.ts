import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {enableBodyScroll, disableBodyScroll, clearAllBodyScrollLocks} from 'body-scroll-lock'
import {useMediaIndex} from '@sanity/ui'

interface ScrollLock {
  isLocked: boolean
  toggle: (force?: boolean) => void
  enable: (force?: boolean) => void
  disable: () => void
}

interface ScrollLockOptions {
  lockOnMount?: boolean
}

interface ElementUpdateOptions extends ScrollLockOptions {
  lockOnMount?: boolean
}

function isElement(element: any): element is HTMLElement {
  return element !== null && element instanceof HTMLElement
}

/**
 * Toggle body scroll lock without breaking scrolling of target element
 *
 * @beta
 * @hidden
 *
 * @param scrollElement - The element you want to keep scroll for when body scroll is locked
 * @returns
 */
export function useScrollLock(
  scrollElement?: HTMLElement | null,
  options: ScrollLockOptions = {
    lockOnMount: true,
  }
) {
  const ref = useRef<HTMLElement | null>(null)
  const lockOnMount = useRef(options?.lockOnMount)
  const currentIndex = useMediaIndex()

  /**
   * Enable this for viewports smaller than 960px
   */
  const isLockable = useMemo(() => currentIndex < 2, [currentIndex])
  const scrollLocked = useRef(false)

  const updateScrollLockOnElementChange = useCallback((newRef: HTMLElement, isLocked?: boolean) => {
    if (!newRef) {
      return
    }

    const currentRef = ref?.current
    const isScrollLocked = isLocked || lockOnMount?.current

    // If already locked before target element changed, restore body scroll
    if (currentRef && isScrollLocked) {
      enableBodyScroll(currentRef)
    }

    // Update ref if not the same
    if (newRef !== currentRef) {
      ref.current = newRef
    }

    // Lock scroll egen after updating element
    if (isScrollLocked) {
      disableBodyScroll(newRef)
    }
  }, [])

  /**
   * Handle changes to the ref element in the cases where we use useState to store
   * the element ref
   */
  useEffect(() => {
    if (isElement(scrollElement)) {
      updateScrollLockOnElementChange(scrollElement, scrollLocked.current)
    }
  }, [updateScrollLockOnElementChange, scrollLocked, scrollElement])

  /**
   * Enable body scroll lock
   */
  const enable = useCallback(() => {
    scrollLocked.current = true

    if (isLockable && ref.current) {
      disableBodyScroll(ref.current)
    }
  }, [isLockable])

  /**
   * Disable body scroll lock
   */
  const disable = useCallback(() => {
    scrollLocked.current = false

    if (ref?.current) {
      enableBodyScroll(ref.current)
    }
  }, [])

  const toggle = useCallback(
    (force = false) => {
      if (force || !scrollLocked.current) {
        enable()
      } else {
        disable()
      }
    },
    [disable, enable]
  )

  // If the breakpoint changes and the scroll is locked, unlock it
  useEffect(() => {
    // This disables scroll locking if viewport width is > 600px
    if (scrollLocked.current && !isLockable) {
      disable()
    }
  }, [disable, isLockable])

  useEffect(() => {
    // Clean up body scroll lock on unmount
    return () => {
      clearAllBodyScrollLocks()
    }
  }, [])

  return {isLocked: scrollLocked, toggle, enable, disable}
}
