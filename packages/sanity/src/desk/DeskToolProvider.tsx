import React, {useMemo, useState} from 'react'
import {DeskToolContext} from './DeskToolContext'
import {createStructureBuilder, DefaultDocumentNodeResolver} from './structureBuilder'
import {DeskToolContextValue, StructureResolver, UnresolvedPaneNode} from './types'
import {useConfigContextFromSource, useDocumentStore, useSource} from 'sanity'

/** @internal */
export interface DeskToolProviderProps {
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  children: React.ReactNode
}

/** @internal */
export function DeskToolProvider({
  defaultDocumentNode,
  structure: resolveStructure,
  children,
}: DeskToolProviderProps): React.ReactElement {
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const source = useSource()
  const configContext = useConfigContextFromSource(source)
  const documentStore = useDocumentStore()

  const S = useMemo(() => {
    return createStructureBuilder({
      defaultDocumentNode,
      source,
    })
  }, [defaultDocumentNode, source])

  const rootPaneNode = useMemo(() => {
    // TODO: unify types and remove cast
    if (resolveStructure)
      return resolveStructure(S, {
        ...configContext,
        documentStore,
      }) as UnresolvedPaneNode
    return S.defaults() as UnresolvedPaneNode
  }, [S, resolveStructure, configContext, documentStore])

  const features: DeskToolContextValue['features'] = useMemo(
    () => ({
      backButton: layoutCollapsed,
      resizablePanes: !layoutCollapsed,
      reviewChanges: !layoutCollapsed,
      splitPanes: !layoutCollapsed,
      splitViews: !layoutCollapsed,
    }),
    [layoutCollapsed],
  )

  const deskTool: DeskToolContextValue = useMemo(() => {
    return {
      features,
      layoutCollapsed,
      setLayoutCollapsed,
      rootPaneNode,
      structureContext: S.context,
    }
  }, [features, layoutCollapsed, rootPaneNode, S.context])

  return <DeskToolContext.Provider value={deskTool}>{children}</DeskToolContext.Provider>
}
