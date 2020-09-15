import {useEffect, useRef, useState} from 'react'

export interface ClickOutsideProps {
  children: (ref: (el: HTMLElement | null) => void) => React.ReactElement
  onClickOutside?: () => void
}

export function ClickOutside({children, onClickOutside}: ClickOutsideProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const hadMouseDownRef = useRef(false)

  useEffect(() => {
    if (!referenceElement || !onClickOutside) return undefined

    const handleWindowMouseUp = (evt: MouseEvent) => {
      const target = evt.target

      if (!referenceElement.contains(target as Node) && !hadMouseDownRef.current) {
        onClickOutside()
      }

      hadMouseDownRef.current = false
    }

    const handleRefMouseDown = () => {
      hadMouseDownRef.current = true
    }

    window.addEventListener('mouseup', handleWindowMouseUp)
    referenceElement.addEventListener('mousedown', handleRefMouseDown)

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp)
      referenceElement.removeEventListener('mousedown', handleRefMouseDown)
    }
  }, [onClickOutside, referenceElement])

  return children(setReferenceElement)
}
