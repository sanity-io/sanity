import React, {forwardRef, useImperativeHandle, useRef} from 'react'
import {SanityDocument} from '@sanity/types'
import {useDocument} from './useDocument'

function getDisplayName(component) {
  return component.displayName || component.name || '<Anonymous>'
}

function warnMissingFocusMethod(ComposedComponent) {
  console.warn(
    `withDocument(${getDisplayName(
      ComposedComponent
    )}): The passed component did not expose a ".focus()" method. Either implement an imperative ` +
      `focus method on the component instance, or forward it's received ref to an element that ` +
      `exposes a .focus() method. The component passed to withDocument was: %O`,
    ComposedComponent
  )
}

type SanityDocumentLike = Pick<SanityDocument, '_id' | '_type'>

export default function withDocument<Props extends {document: SanityDocumentLike}>(
  ComposedComponent: React.ComponentType<Props>
): React.ComponentType<Omit<Props, 'document'>> {
  const WithDocument = forwardRef((props: Props, ref) => {
    const nextRef = useRef<{focus?: unknown}>()
    const didShowFocusWarningRef = useRef(false)
    const document = useDocument()

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (typeof nextRef.current?.focus === 'function') {
          nextRef.current.focus()
        } else if (!didShowFocusWarningRef.current) {
          warnMissingFocusMethod(ComposedComponent)
          didShowFocusWarningRef.current = true
        }
      },
    }))

    return <ComposedComponent ref={ref} document={document} {...props} />
  })

  WithDocument.displayName = `withDocument(${
    ComposedComponent.displayName || ComposedComponent.name
  })`

  return (WithDocument as unknown) as React.ComponentType<Omit<Props, 'document'>>
}
