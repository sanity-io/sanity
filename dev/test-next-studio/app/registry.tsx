// https://beta.nextjs.org/docs/styling/css-in-js#styled-components

'use client'

import React, {useState} from 'react'
import {useServerInsertedHTML} from 'next/navigation'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

export default function StyledComponentsRegistry({children}: {children: React.ReactNode}) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    // @ts-expect-error -- clearTag exists but `@types/styled-components` is missing its definitions
    styledComponentsStyleSheet.instance.clearTag()
    return styles
  })

  if (typeof window !== 'undefined') return children as JSX.Element

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children as React.ReactNode}
    </StyleSheetManager>
  )
}
