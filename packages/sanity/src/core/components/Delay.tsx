import {useEffect, useState} from 'react'

/**
 * Renders its children after the given delay has elapsed.
 *
 * @internal
 */
export function Delay({
  children,
  ms = 0,
}: {
  children?: React.JSX.Element | (() => React.JSX.Element)
  ms?: number
}): React.JSX.Element {
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
