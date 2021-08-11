import React, {useEffect} from 'react'

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}
