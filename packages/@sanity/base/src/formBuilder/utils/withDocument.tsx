import {SanityDocument} from '@sanity/types'
import React, {forwardRef, useEffect, useState} from 'react'
import {FIXME} from '../types'
import {useFormBuilder} from '../useFormBuilder'

interface WithDocumentProps<Doc extends SanityDocument = SanityDocument> {
  document: Doc
}

export function withDocument<T extends WithDocumentProps = WithDocumentProps>(
  ComposedComponent: React.ComponentType<T>
) {
  const WithDocument = forwardRef(function WithDocument(
    props: Omit<T, 'document'>,
    ref: React.ForwardedRef<any>
  ) {
    const {__internal_patchChannel: patchChannel, getDocument} = useFormBuilder()
    const [state, setState] = useState(() => ({document: getDocument()}))

    useEffect(() => {
      return patchChannel.subscribe(({snapshot}) => {
        // we will also receive "delete"-patches, with {snapshot: null}. Don't pass null documents.
        if (snapshot) {
          setState({document: snapshot})
        }
      })
    }, [patchChannel])

    return <ComposedComponent ref={ref} document={state.document} {...(props as FIXME)} />
  })

  WithDocument.displayName = `withDocument(${
    ComposedComponent.displayName || ComposedComponent.name
  })`

  return WithDocument
}
