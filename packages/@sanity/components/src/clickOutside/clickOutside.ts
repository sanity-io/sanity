import {useEffect, useRef} from 'react'

export interface ClickOutsideProps {
  children: (ref: React.MutableRefObject<HTMLElement | null>) => React.ReactElement
  onClickOutside: () => void
}

export function ClickOutside({children, onClickOutside}: ClickOutsideProps) {
  const ref = useRef<HTMLElement | null>(null)
  const hadMouseDownRef = useRef(false)

  useEffect(() => {
    const el = ref.current

    if (!el) return undefined

    const handleWindowMouseUp = (evt: MouseEvent) => {
      const target = evt.target

      if (!el.contains(target as Node) && !hadMouseDownRef.current) {
        onClickOutside()
      }

      hadMouseDownRef.current = false
    }

    const handleRefMouseDown = () => {
      hadMouseDownRef.current = true
    }

    window.addEventListener('mouseup', handleWindowMouseUp)
    el.addEventListener('mousedown', handleRefMouseDown)

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp)
      el.removeEventListener('mousedown', handleRefMouseDown)
    }
  }, [onClickOutside])

  return children(ref)
}
