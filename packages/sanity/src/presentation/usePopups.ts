import {type Controller} from '@sanity/comlink'
import {useCallback, useEffect, useState} from 'react'

import {POPUP_CHECK_INTERVAL} from './constants'

/**
 * A hook for managing popup Window contexts
 *
 * This hook handles:
 * - Opening new popup Windows, and adding them as targets to the controller
 * - Tracking existing popup windows, and cleaning up closed popups
 *
 * @param controller - Comlink controller instance that manages communication
 * between Window contexts
 *
 * @returns An object containing:
 * - popups: A Set of currently open popup Window objects
 * - open: Function to open a new popup Window with the specified URL
 *
 */
export const usePopups = (
  controller?: Controller,
): {
  popups: Set<Window>
  open: (url: string) => void
} => {
  // State to keep track of open popup windows
  const [popups, setPopups] = useState<Set<Window>>(() => new Set())

  // Function to open a new popup window
  const open = useCallback((url: string) => {
    const source = window.open(url, '_blank')
    if (source) {
      setPopups((prev) => new Set(prev).add(source))
    }
  }, [])

  // Handles syncing the existing popups with the controller
  useEffect(() => {
    const unsubs: Array<() => void> = []
    if (popups.size && controller) {
      // loop popups and add targets
      for (const source of popups) {
        if (source && 'closed' in source && !source.closed) {
          unsubs.push(controller.addTarget(source))
        }
      }
    }
    return () => {
      unsubs.forEach((unsub) => unsub())
    }
  }, [controller, popups])

  // Checks for closed popups and removes them from the tracked Set
  useEffect(() => {
    if (popups.size) {
      const interval = setInterval(() => {
        const closed = new Set<Window>()
        for (const source of popups) {
          if (source && 'closed' in source && source.closed) {
            closed.add(source)
          }
        }
        if (closed.size) {
          setPopups((prev) => {
            const next = new Set(prev)
            for (const source of closed) {
              next.delete(source)
            }
            return next
          })
        }
      }, POPUP_CHECK_INTERVAL)

      return () => {
        clearInterval(interval)
      }
    }
    return undefined
  }, [popups])

  return {popups, open}
}
