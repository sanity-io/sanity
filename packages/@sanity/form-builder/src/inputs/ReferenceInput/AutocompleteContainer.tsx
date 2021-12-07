import {Grid, useElementRect, useForwardedRef} from '@sanity/ui'
import React, {ReactNode, ForwardedRef, forwardRef, useCallback, useState} from 'react'
import styled, {css} from 'styled-components'

const NARROW_LAYOUT = css`
  grid-template-columns: minmax(0px, 1fr);
`

const WIDE_LAYOUT = css`
  grid-template-columns: 1fr min-content;
`

const Root = styled(Grid)<{$narrow: boolean}>((props: {$narrow: boolean}) =>
  props.$narrow ? NARROW_LAYOUT : WIDE_LAYOUT
)

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

  return (
    <Root ref={handleNewRef} gap={1} $narrow={inputWrapperRect?.width < 480}>
      {props.children}
    </Root>
  )
})
