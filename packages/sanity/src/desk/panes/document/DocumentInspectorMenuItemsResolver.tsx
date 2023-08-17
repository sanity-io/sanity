import React, {memo, useCallback, useEffect, useRef, useState} from 'react'
import {DocumentInspector, DocumentInspectorMenuItem, useUnique} from 'sanity'

interface InspectorMenuItemProps {
  documentId: string
  documentType: string
  index: number
  setMenuItem: (index: number, node: DocumentInspectorMenuItem) => void
  useMenuItem: NonNullable<DocumentInspector['useMenuItem']>
}

const InspectorMenuItem = memo(function InspectorMenuItem(props: InspectorMenuItemProps) {
  const {documentId, documentType, index, setMenuItem, useMenuItem} = props

  const node = useUnique(
    useMenuItem({
      documentId,
      documentType,
    }),
  )

  useEffect(() => {
    setMenuItem(index, node)
  }, [index, node, setMenuItem])

  return <></>
})

interface DocumentInspectorMenuItemsResolverProps {
  documentId: string
  documentType: string
  inspectors: DocumentInspector[]
  onMenuItems: (items: DocumentInspectorMenuItem[]) => void
}

// The menu item in a document inspector are resolved in a React hook (`useMenuItem`).
// This means that the menu item needs to be resolved in a React component (in accordance with the rules of hooks).
// In this component, we map over the configured inspectors and render a `InspectorMenuItem` for each.
// The `InspectorMenuItem` will resolve the menu item in a React hook and call the `setMenuItem` callback
// with the resolved menu item and the index of the inspector.
// Finally, we call the `onMenuItems` callback with the resolved menu items.
export function DocumentInspectorMenuItemsResolver(props: DocumentInspectorMenuItemsResolverProps) {
  const {documentId, documentType, inspectors, onMenuItems} = props

  const len = inspectors.length
  const lenRef = useRef(len)

  const [menuItems, setMenuItems] = useState<DocumentInspectorMenuItem[]>(() =>
    Array.from(new Array(len)),
  )

  const menuItemsRef = useRef(menuItems)

  useEffect(() => {
    if (lenRef.current !== len) {
      const newFieldActions = Array.from(new Array(len))

      for (let i = 0; i < len; i++) {
        newFieldActions[i] = menuItemsRef.current[i]
      }

      lenRef.current = len

      setMenuItems(() => {
        menuItemsRef.current = newFieldActions
        return newFieldActions
      })
    }
  }, [len])

  const setMenuItem = useCallback((index: number, node: DocumentInspectorMenuItem) => {
    setMenuItems((prev) => {
      const next = [...prev]
      next[index] = node
      menuItemsRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    onMenuItems(menuItems.filter(Boolean))
  }, [menuItems, onMenuItems])

  return (
    <>
      {inspectors.map(
        (inspector, inspectorIndex) =>
          inspector.useMenuItem && (
            <InspectorMenuItem
              documentId={documentId}
              documentType={documentType}
              index={inspectorIndex}
              key={inspector.name}
              setMenuItem={setMenuItem}
              useMenuItem={inspector.useMenuItem}
            />
          ),
      )}
    </>
  )
}
