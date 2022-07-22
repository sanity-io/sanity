import React, {useMemo, useState} from 'react'
import {useSource} from '../studio'
import type {ConfigContext, Source} from '../config'
import {DeskToolContext} from './DeskToolContext'
import {createStructureBuilder, DefaultDocumentNodeResolver} from './structureBuilder'
import {StructureResolver, UnresolvedPaneNode} from './types'

interface DeskToolProviderProps {
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  children: React.ReactNode
}

function useConfigContextFromSource(source: Source): ConfigContext {
  const {projectId, dataset, schema, currentUser, client} = source
  return useMemo(() => {
    return {projectId, dataset, schema, currentUser, client}
  }, [projectId, dataset, schema, currentUser, client])
}

export function DeskToolProvider({
  defaultDocumentNode,
  structure: resolveStructure,
  children,
}: DeskToolProviderProps): React.ReactElement {
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const source = useSource()
  const configContext = useConfigContextFromSource(source)

  const S = useMemo(() => {
    return createStructureBuilder({
      defaultDocumentNode,
      source,
    })
  }, [defaultDocumentNode, source])

  const rootPaneNode = useMemo(() => {
    // TODO: unify types and remove cast
    if (resolveStructure) return resolveStructure(S, configContext) as UnresolvedPaneNode
    return S.defaults() as UnresolvedPaneNode
  }, [S, resolveStructure, configContext])

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
