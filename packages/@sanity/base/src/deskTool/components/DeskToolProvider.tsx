import React, {createContext, useMemo, useState, useContext} from 'react'
import {useSource} from '../../studio'
import {
  createStructureBuilder,
  DefaultDocumentNodeResolver,
  StructureContext,
} from '../structureBuilder'
import {StructureResolver, UnresolvedPaneNode} from '../types'

export interface DeskToolFeatures {
  /**
   * @beta
   */
  backButton: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}

export interface DeskToolContextValue {
  features: DeskToolFeatures
  layoutCollapsed: boolean
  setLayoutCollapsed: (layoutCollapsed: boolean) => void

  rootPaneNode: UnresolvedPaneNode
  structureContext: StructureContext
}

const DeskToolContext = createContext<DeskToolContextValue | null>(null)

export function useDeskTool(id?: string): DeskToolContextValue {
  const deskTool = useContext(DeskToolContext)
  if (!deskTool) throw new Error(`DeskTool: missing context value ${id}`)
  return deskTool
}

interface DeskToolProviderProps {
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  children: React.ReactNode
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
