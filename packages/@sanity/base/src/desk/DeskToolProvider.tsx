import React, {useMemo, useState} from 'react'
import {useSource} from '../studio'
import {createStructureBuilder, DefaultDocumentNodeResolver} from './structureBuilder'
import {StructureResolver, UnresolvedPaneNode} from './types'
import {DeskToolContext} from './DeskToolContext'

export interface DeskToolProviderProps {
  children: React.ReactNode
  defaultDocumentNode?: DefaultDocumentNodeResolver
  structure?: StructureResolver
}

export function DeskToolProvider({
  defaultDocumentNode,
  structure: resolveStructure,
  children,
}: DeskToolProviderProps): React.ReactElement {
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const source = useSource()

  const S = useMemo(() => {
    return createStructureBuilder({
      defaultDocumentNode: defaultDocumentNode,
      source,
    })
  }, [defaultDocumentNode, source])

  const rootPaneNode = useMemo(() => {
    // TODO: unify types and remove cast
    if (resolveStructure) return resolveStructure(S, source) as UnresolvedPaneNode
    return S.defaults() as UnresolvedPaneNode
  }, [S, resolveStructure, source])

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
