import {useElementSize} from '@sanity/ui'
import {type ReactNode, type Ref, useCallback, useState} from 'react'
import {css, styled} from 'styled-components'
import {Grid} from 'ui5'

const NARROW_LAYOUT = css`
  grid-template-columns: minmax(0px, 1fr);
`

const WIDE_LAYOUT = css`
  grid-template-columns: 1fr min-content;
`

const Root = styled(Grid)<{$narrow: boolean}>((props: {$narrow: boolean}) =>
  props.$narrow ? NARROW_LAYOUT : WIDE_LAYOUT,
)

export function AutocompleteContainer(props: {children: ReactNode; ref?: Ref<HTMLDivElement>}) {
  const {children, ref: forwardedRef} = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleNewRef = useCallback(
    (element: HTMLDivElement) => {
      // there's a bit of "double bookkeeping" here. since useElementSize needs to re-run whenever the ref updates,
      // and thus we need to keep it in the state
      setForwardedRef(forwardedRef, element)
      setRootElement(element)
    },
    [forwardedRef],
  )

  const inputWrapperSize = useElementSize(rootElement)

  return (
    <Root ref={handleNewRef} gap={1} $narrow={(inputWrapperSize?.border.width || 480) < 480}>
      {children}
    </Root>
  )
}

function setForwardedRef<T>(ref: Ref<T> | undefined, instance: T) {
  if (typeof ref === 'function') {
    ref(instance)
  } else if (ref) {
    ref.current = instance
  }
}
