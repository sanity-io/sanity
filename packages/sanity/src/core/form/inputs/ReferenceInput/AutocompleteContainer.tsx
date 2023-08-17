import {Grid, useElementRect} from '@sanity/ui'
import React, {ReactNode, ForwardedRef, forwardRef, useCallback, useState} from 'react'
import styled, {css} from 'styled-components'

const NARROW_LAYOUT = css`
  grid-template-columns: minmax(0px, 1fr);
`

const WIDE_LAYOUT = css`
  grid-template-columns: 1fr min-content;
`

const Root = styled(Grid)<{$narrow: boolean}>((props: {$narrow: boolean}) =>
  props.$narrow ? NARROW_LAYOUT : WIDE_LAYOUT,
)

export const AutocompleteContainer = forwardRef(function AutocompleteContainer(
  props: {
    children: ReactNode
  },
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleNewRef = useCallback(
    (element: HTMLDivElement) => {
      // there's a bit of "double bookkeeping" here. since useElementRect needs to re-run whenever the ref updates,
      // and thus we need to keep it in the state
      setForwardedRef(forwardedRef, element)
      setRootElement(element)
    },
    [forwardedRef],
  )

  const inputWrapperRect = useElementRect(rootElement)

  return (
    <Root ref={handleNewRef} gap={1} $narrow={(inputWrapperRect?.width || 0) < 480}>
      {props.children}
    </Root>
  )
})

function setForwardedRef<T>(ref: ForwardedRef<T>, instance: T) {
  if (typeof ref === 'function') {
    ref(instance)
  } else if (ref) {
    ref.current = instance
  }
}
