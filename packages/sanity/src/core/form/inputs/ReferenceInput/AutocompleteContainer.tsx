import {Grid, useElementSize} from '@sanity/ui'
import {type ReactNode, type Ref, useCallback, useState} from 'react'

import {root} from './AutocompleteContainer.css'

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
  const narrow = (inputWrapperSize?.border.width || 480) < 480

  return (
    <Grid ref={handleNewRef} gap={1} className={narrow ? root.narrow : root.wide}>
      {children}
    </Grid>
  )
}

function setForwardedRef<T>(ref: Ref<T> | undefined, instance: T) {
  if (typeof ref === 'function') {
    ref(instance)
  } else if (ref) {
    ref.current = instance
  }
}
