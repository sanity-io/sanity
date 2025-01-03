import {type ReactElement, useEffect, useState} from 'react'

export function Delay({
  children,
  ms = 0,
}: {
  children?: ReactElement<any> | (() => ReactElement<any>)
  ms?: number
}): ReactElement<any> {
  const [ready, setReady] = useState(ms <= 0)

  useEffect(() => {
    if (ms <= 0) {
      return undefined
    }

    const timeoutId = setTimeout(() => setReady(true), ms)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [ms])

  if (!ready || !children) {
    return <></>
  }

  return typeof children === 'function' ? children() : children
}
