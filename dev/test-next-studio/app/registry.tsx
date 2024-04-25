// https://beta.nextjs.org/docs/styling/css-in-js#styled-components

'use client'

import {useServerInsertedHTML} from 'next/navigation'
import {useState, useSyncExternalStore} from 'react'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

export function StyledComponentsRegistry({children}: {children: React.ReactNode}): JSX.Element {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  if (isMounted) return <>{children}</>

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>{children}</StyleSheetManager>
  )
}

// eslint-disable-next-line no-empty-function
const emptySubscribe = () => () => {}
