import React, {useEffect} from 'react'

export function usePrevious(value) {
  const ref = React.useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current || -1
}
