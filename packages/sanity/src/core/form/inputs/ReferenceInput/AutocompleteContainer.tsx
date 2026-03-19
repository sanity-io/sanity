import {Grid, useElementRect} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode, useCallback, useState} from 'react'

import {rootVariants} from './AutocompleteContainer.css'

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
  const narrow = (inputWrapperRect?.width || 480) < 480

  return (
    <Grid ref={handleNewRef} gap={1} className={narrow ? rootVariants.narrow : rootVariants.wide}>
      {props.children}
    </Grid>
  )
})

function setForwardedRef<T>(ref: ForwardedRef<T>, instance: T) {
  if (typeof ref === 'function') {
    ref(instance)
  } else if (ref) {
    ref.current = instance
  }
}
