import {memo, useEffect} from 'react'
import {type SanityDocument} from 'sanity'

import {usePresentationParams} from '../usePresentationParams'
import {useDisplayedDocumentBroadcaster} from './DisplayedDocumentBroadcaster'

/**
 * Sanity Form input component that reads the current form state and broadcasts it to
 * the live query store
 */
function BroadcastDisplayedDocument(props: {
  value: Partial<SanityDocument> | null | undefined
}): React.JSX.Element | null {
  const setDisplayedDocument = useDisplayedDocumentBroadcaster()
  const params = usePresentationParams(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayedDocument?.(props.value), 10)
    return () => clearTimeout(timeout)
  }, [params?.perspective, props.value, setDisplayedDocument])

  return null
}

export default memo(BroadcastDisplayedDocument)
