import {useCallback, useRef, useState} from 'react'

/** @internal */
export function useModifierKey(): {
  isPressed: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
} {
  const [isPressed, setIsPressed] = useState(false)
  const listenersAttached = useRef(false)

  const handleKey = useCallback((event: KeyboardEvent) => {
    setIsPressed(event.metaKey || event.ctrlKey)
  }, [])

  const handleBlur = useCallback(() => {
    setIsPressed(false)
  }, [])

  const onMouseEnter = useCallback(() => {
    if (listenersAttached.current) return

    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    window.addEventListener('blur', handleBlur)
    listenersAttached.current = true
  }, [handleBlur, handleKey])

  const onMouseLeave = useCallback(() => {
    if (!listenersAttached.current) return

    window.removeEventListener('keydown', handleKey)
    window.removeEventListener('keyup', handleKey)
    window.removeEventListener('blur', handleBlur)
    listenersAttached.current = false
    setIsPressed(false)
  }, [handleBlur, handleKey])

  return {isPressed, onMouseEnter, onMouseLeave}
}
