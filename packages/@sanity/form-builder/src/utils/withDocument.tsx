import React, {forwardRef, useContext} from 'react'
import {DocumentContext} from '../contexts/document'

interface WithDocumentProps<Doc extends Record<string, unknown> = Record<string, unknown>> {
  document: Doc & {_id: string; _type: string}
}

export default function withDocument<T extends WithDocumentProps = WithDocumentProps>(
  ComposedComponent: React.ComponentType<T>
) {
  const Composed = forwardRef(function WithDocument(props: Omit<T, 'document'>, ref) {
    const document = useContext(DocumentContext)

    return <ComposedComponent ref={ref} document={document} {...(props as T)} />
  })
  Composed.displayName = `withDocument(${ComposedComponent.displayName || ComposedComponent.name})`
  return Composed
}
