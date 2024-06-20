import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type DocumentInspector, type DocumentInspectorMenuItem, useUnique} from 'sanity'

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

  const InspectorMenuItems = useMemo(() => {
    return inspectors.map((inspector, index) => {
      return inspector.useMenuItem
        ? ([
            defineInspectorMenuItemComponent({
              documentId,
              documentType,
              index,
              setMenuItem,
              useMenuItem: inspector.useMenuItem,
            }),
            inspector.name,
          ] as const)
        : ([() => null, ''] as const)
    })
  }, [documentId, documentType, inspectors, setMenuItem])

  return (
    <>
      {InspectorMenuItems.map(([InspectorMenuItem, key]) => key && <InspectorMenuItem key={key} />)}
    </>
  )
}

function defineInspectorMenuItemComponent({
  documentId,
  documentType,
  index,
  setMenuItem,
  useMenuItem,
}: {
  documentId: string
  documentType: string
  index: number
  setMenuItem: (index: number, node: DocumentInspectorMenuItem) => void
  useMenuItem: NonNullable<DocumentInspector['useMenuItem']>
}) {
  return memo(function InspectorMenuItem() {
    const menuItem = useMenuItem({
      documentId,
      documentType,
    })
    const node = useUnique(menuItem)

    useEffect(() => {
      setMenuItem(index, node)
    }, [node])

    return null
  })
}
