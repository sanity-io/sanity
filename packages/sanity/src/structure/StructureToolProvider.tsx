import React, {useMemo, useState} from 'react'
import {StructureToolContext} from './StructureToolContext'
import {createStructureBuilder, type DefaultDocumentNodeResolver} from './structureBuilder'
import type {StructureToolContextValue, StructureResolver, UnresolvedPaneNode} from './types'
import {useConfigContextFromSource, useDocumentStore, useSource} from 'sanity'

/** @internal */
export interface StructureToolProviderProps {
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  children: React.ReactNode
}

/** @internal */
export function StructureToolProvider({
  defaultDocumentNode,
  structure: resolveStructure,
  children,
}: StructureToolProviderProps): React.ReactElement {
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

  const features: StructureToolContextValue['features'] = useMemo(
    () => ({
      backButton: layoutCollapsed,
      resizablePanes: !layoutCollapsed,
      reviewChanges: !layoutCollapsed,
      splitPanes: !layoutCollapsed,
      splitViews: !layoutCollapsed,
    }),
    [layoutCollapsed],
  )

  const structureTool: StructureToolContextValue = useMemo(() => {
    return {
      features,
      layoutCollapsed,
      setLayoutCollapsed,
      rootPaneNode,
      structureContext: S.context,
    }
  }, [features, layoutCollapsed, rootPaneNode, S.context])

  return (
    <StructureToolContext.Provider value={structureTool}>{children}</StructureToolContext.Provider>
  )
}
