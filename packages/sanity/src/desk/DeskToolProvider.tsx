import React, {useMemo, useState} from 'react'
import {DeskToolContext} from './DeskToolContext'
import {createStructureBuilder, DefaultDocumentNodeResolver} from './structureBuilder'
import {StructureResolver, UnresolvedPaneNode} from './types'
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

  return (
    <DeskToolContext.Provider
      value={useMemo(() => {
        return {
          features: {
            backButton: layoutCollapsed,
            reviewChanges: !layoutCollapsed,
            splitPanes: !layoutCollapsed,
            splitViews: !layoutCollapsed,
          },
          layoutCollapsed,
          setLayoutCollapsed,
          rootPaneNode,
          structureContext: S.context,
        }
      }, [layoutCollapsed, rootPaneNode, S.context])}
    >
      {children}
    </DeskToolContext.Provider>
  )
}
