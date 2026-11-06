import {type CSSProperties, type RefObject, useCallback, useRef, useState} from 'react'

const MAX_MEASURE_ATTEMPTS = 4

/**
 * The releases and variants menus size themselves to their content, between a
 * minimum and a maximum width. Call `lockMenuWidth` when the menu opens: after
 * it has laid out, that width is held until `resetMenuWidth` on close, so
 * filtering or a title change cannot resize it.
 *
 * The open callback runs before the popover is shown, and the menu node is
 * portaled in on open, so the measurement waits until a frame where it has a
 * real width.
 */
export function useStableMenuWidth(): {
  menuRef: RefObject<HTMLDivElement | null>
  menuStyle: CSSProperties | undefined
  lockMenuWidth: () => void
  resetMenuWidth: () => void
} {
  const menuRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [width, setWidth] = useState<number | null>(null)
  const lockedWidth = useRef<number | null>(null)

  const resetMenuWidth = useCallback(() => {
    cancelAnimationFrame(frame.current)
    lockedWidth.current = null
    setWidth(null)
  }, [])

  const lockMenuWidth = useCallback(() => {
    if (lockedWidth.current !== null) return
    let attempts = 0

    const measure = () => {
      if (lockedWidth.current !== null) return
      const measured = menuRef.current?.offsetWidth ?? 0
      if (measured === 0 && attempts < MAX_MEASURE_ATTEMPTS) {
        attempts += 1
        frame.current = requestAnimationFrame(measure)
        return
      }
      if (measured === 0) return
      lockedWidth.current = measured
      setWidth(measured)
    }

    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(measure)
  }, [])

  const menuStyle: CSSProperties | undefined =
    width === null ? undefined : {width, minWidth: width, maxWidth: width}

  return {menuRef, menuStyle, lockMenuWidth, resetMenuWidth}
}
