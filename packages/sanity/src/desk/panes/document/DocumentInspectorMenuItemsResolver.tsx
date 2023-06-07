import React, {memo, useCallback, useEffect, useState} from 'react'
import {DocumentInspector, DocumentInspectorMenuItem, useUnique} from 'sanity'

interface InspectorMenuItemProps {
  inspector: DocumentInspector
  documentId: string
  documentType: string
  index: number
  setMenuItem: (node: DocumentInspectorMenuItem, index: number) => void
}

const InspectorMenuItem = memo(function InspectorMenuItem(props: InspectorMenuItemProps) {
  const {inspector, documentId, documentType, index, setMenuItem} = props

  const node = useUnique(
    inspector.useMenuItem({
      documentId,
      documentType,
    })
  )

  useEffect(() => {
    setMenuItem(node, index)
  }, [index, node, setMenuItem])

  return <></>
})

interface DocumentInspectorMenuItemsResolverProps {
  documentId: string
  documentType: string
  inspectors: DocumentInspector[]
  onResolvedItems: (items: DocumentInspectorMenuItem[]) => void
}

// The menu item in a document inspector are resolved in a React hook (`useMenuItem`).
// This means that the menu item needs to be resolved in a React component (in accordance with the rules of hooks).
// In this component, we map over the configured inspectors and render a `InspectorMenuItem` for each.
// The `InspectorMenuItem` will resolve the menu item in a React hook and call the `setMenuItem` callback
// with the resolved menu item and the index of the inspector.
// Finally, we call the `onResolvedItems` callback with the resolved menu items.
export function DocumentInspectorMenuItemsResolver(props: DocumentInspectorMenuItemsResolverProps) {
  const {documentId, documentType, inspectors, onResolvedItems} = props

  const [inspectorMenuItems, setInspectorMenuItems] = useState<DocumentInspectorMenuItem[]>([])

  const handleSetInspectorMenuItem = useCallback(
    (item: DocumentInspectorMenuItem, itemIndex: number) => {
      setInspectorMenuItems((prev) => {
        const next = [...prev]
        next[itemIndex] = item
        return next
      })
    },
    []
  )

  useEffect(() => {
    onResolvedItems(inspectorMenuItems)
  }, [inspectorMenuItems, onResolvedItems])

  return (
    <>
      {inspectors.map((inspector, inspectorIndex) => (
        <InspectorMenuItem
          documentId={documentId}
          documentType={documentType}
          index={inspectorIndex}
          inspector={inspector}
          key={inspector.name}
          setMenuItem={handleSetInspectorMenuItem}
        />
      ))}
    </>
  )
}
