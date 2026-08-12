import {type ReactNode, useMemo, useState} from 'react'
import {useConfigContextFromSource, useDocumentStore, usePerspective, useSource} from 'sanity'
import {StructureToolContext} from 'sanity/_singletons'

import {createStructureBuilder} from './structureBuilder/createStructureBuilder'
import {type DefaultDocumentNodeResolver} from './structureBuilder/types'
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const source = useSource()
  const configContext = useConfigContextFromSource(source)
  const documentStore = useDocumentStore()

  const {perspectiveStack, selectedVariantName} = usePerspective()

  const S = useMemo(() => {
    return createStructureBuilder({
      defaultDocumentNode,
      source,
      perspectiveStack,
      selectedVariantName,
    })
  }, [defaultDocumentNode, source, perspectiveStack, selectedVariantName])

  const rootPaneNode = useMemo(() => {
    // TODO: unify types and remove cast
    if (resolveStructure)
      return resolveStructure(S, {
        ...configContext,
        documentStore,

        perspectiveStack,
        selectedVariantName,
      }) as UnresolvedPaneNode
    return S.defaults() as UnresolvedPaneNode
  }, [resolveStructure, S, configContext, documentStore, perspectiveStack, selectedVariantName])

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
