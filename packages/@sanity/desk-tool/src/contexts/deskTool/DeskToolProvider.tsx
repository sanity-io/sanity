import {SchemaType} from '@sanity/types'
import React, {useMemo} from 'react'
import {DocumentActionsResolver} from '../../types'
import {DeskToolContext} from './DeskToolContext'
import {DeskToolContextValue} from './types'

/**
 * @internal
 */
export function DeskToolProvider(props: {
  children?: React.ReactNode
  components: {LanguageFilter?: React.ComponentType<{schemaType: SchemaType}>}
  layoutCollapsed: boolean
  resolveDocumentActions: DocumentActionsResolver
  structure: any
}): React.ReactElement {
  const {children, components, layoutCollapsed, resolveDocumentActions, structure} = props

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
      components,
      features,
      layoutCollapsed,
      resolveDocumentActions,
      structure,
    }),
    [components, features, layoutCollapsed, resolveDocumentActions, structure]
  )

  return <DeskToolContext.Provider value={contextValue}>{children}</DeskToolContext.Provider>
}
