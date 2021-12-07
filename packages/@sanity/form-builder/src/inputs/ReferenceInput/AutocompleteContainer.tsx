import {Grid, useElementRect, Stack, useForwardedRef} from '@sanity/ui'
import type {ReactNode} from 'react'
import React, {ForwardedRef, forwardRef, useCallback, useState} from 'react'
import styled from 'styled-components'

const GridLayout = styled(Grid)`
  grid-template-columns: 1fr min-content;
`

export const AutocompleteContainer = forwardRef(function AutocompleteContainer(
  props: {
    children: ReactNode
  },
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const ref = useForwardedRef(forwardedRef)

  const [rootElement, setRootElement] = useState<HTMLDivElement>(ref.current)

  const handleNewRef = useCallback(
    (element: HTMLDivElement) => {
      // there's a bit of "double bookkeeping" here, since useElementRef and useForwardedRef doesn't compose all that well
      // (useElementRect requires the state to be updated whenever the element change)
      ref.current = element
      setRootElement(element)
    },
    [ref]
  )

  const inputWrapperRect = useElementRect(rootElement)
  const isNarrow = inputWrapperRect?.width < 480

  if (isNarrow) {
    return (
      <Stack ref={handleNewRef} space={1}>
        {props.children}
      </Stack>
    )
  }
  return (
    <GridLayout ref={handleNewRef} gap={1}>
      {props.children}
    </GridLayout>
  )
})
