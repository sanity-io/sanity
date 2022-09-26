import {useEffect, useRef, useState} from 'react'

export function useHover<T extends HTMLElement>(): [React.MutableRefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [value, setValue] = useState(false)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return () => undefined
    }

    const handleMouseOver = () => setValue(true)
    const handleMouseOut = () => setValue(false)

    node.addEventListener('mouseover', handleMouseOver)
    node.addEventListener('mouseout', handleMouseOut)

    return () => {
      node.removeEventListener('mouseover', handleMouseOver)
      node.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  return [ref, value]
}
