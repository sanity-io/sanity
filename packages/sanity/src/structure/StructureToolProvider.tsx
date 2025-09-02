import {type ReactNode, useMemo, useState} from 'react'
import {useConfigContextFromSource, useDocumentStore, usePerspective, useSource} from 'sanity'
import {StructureToolContext} from 'sanity/_singletons'

import {createStructureBuilder, type DefaultDocumentNodeResolver} from './structureBuilder'
import {
  type StructureResolver,
  type StructureToolContextValue,
  type UnresolvedPaneNode,
} from './types'

/** @internal */
export interface StructureToolProviderProps {
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  children: ReactNode
}

/** @internal */
export function StructureToolProvider({
  defaultDocumentNode,
  structure: resolveStructure,
  children,
}: StructureToolProviderProps): React.JSX.Element {
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const source = useSource()
  const configContext = useConfigContextFromSource(source)
  const documentStore = useDocumentStore()

  const {perspectiveStack} = usePerspective()

  const S = createStructureBuilder({
    defaultDocumentNode,
    source,
    perspectiveStack,
  })

  const rootPaneNode = resolveStructure
    ? (resolveStructure(S, {
        ...configContext,
        documentStore,

        perspectiveStack,
      }) as UnresolvedPaneNode)
    : (S.defaults() as UnresolvedPaneNode)

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
