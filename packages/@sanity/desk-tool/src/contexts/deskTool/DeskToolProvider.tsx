import {DocumentBuilder} from '@sanity/structure'
import React, {useMemo} from 'react'
import {DeskToolContext} from './DeskToolContext'
import {DeskToolContextValue} from './types'

/**
 * @internal
 */
export function DeskToolProvider(props: {
  children?: React.ReactNode
  layoutCollapsed: boolean
  resolveDocumentNode: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  structure: any
}): React.ReactElement {
  const {children, layoutCollapsed, resolveDocumentNode, structure} = props

  const features = useMemo(
    () => ({
      backButton: layoutCollapsed,
      reviewChanges: !layoutCollapsed,
      splitPanes: !layoutCollapsed,
      splitViews: !layoutCollapsed,
    }),
    [layoutCollapsed]
  )

  const contextValue: DeskToolContextValue = useMemo(
    () => ({
      features,
      layoutCollapsed,
      resolveDocumentNode,
      structure,
    }),
    [features, layoutCollapsed, resolveDocumentNode, structure]
  )

  return <DeskToolContext.Provider value={contextValue}>{children}</DeskToolContext.Provider>
}
