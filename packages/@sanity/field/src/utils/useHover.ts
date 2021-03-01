import {useState, useRef, useEffect} from 'react'

export function useHover<T extends HTMLElement>(): [React.MutableRefObject<T | null>, boolean] {
  const [value, setValue] = useState(false)

  const ref = useRef<T | null>(null)

  const handleMouseOver = () => setValue(true)
  const handleMouseOut = () => setValue(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return () => undefined
    }

    node.addEventListener('mouseover', handleMouseOver)
    node.addEventListener('mouseout', handleMouseOut)

    return () => {
      node.removeEventListener('mouseover', handleMouseOver)
      node.removeEventListener('mouseout', handleMouseOut)
    }
  }, [ref.current])

  return [ref, value]
}
