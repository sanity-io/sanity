import {SanityTool, useConfig} from '@sanity/base'
import {useRouterState} from '@sanity/base/router'
import {
  DocumentBuilder,
  DocumentNode,
  DocumentNodeResolver,
  useStructure,
} from '@sanity/base/structure'
import {isRecord, isString} from '@sanity/base/util'
import {SchemaType} from '@sanity/types'
import {ErrorBoundary, ErrorBoundaryProps} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {resolveDocumentActions as defaultResolveDocumentActions} from './actions/resolveDocumentActions'
import {IntentResolver} from './components/intentResolver'
import {StructureError} from './components/StructureError'
import {DeskTool} from './DeskTool'
import {setActivePanes} from './getIntentState'
import {defaultResolveStructure} from './defaults/defaultResolveStructure'
import {validateStructure} from './structure/validateStructure'
import {defaultResolveDocumentNode} from './defaults/defaultResolveStructureDocumentNode'
import {DocumentActionsResolver, StructureResolver} from './types'

export interface DeskToolOptions {
  components?: {
    LanguageFilter?: React.ComponentType<{schemaType: SchemaType}>
  }
  icon?: React.ComponentType
  name?: string
  resolveDocumentActions?: DocumentActionsResolver
  resolveStructure?: StructureResolver
  title?: string
}

export default function DeskToolRoot(props: {tool: SanityTool<DeskToolOptions>}) {
  const {
    components: componentsOption,
    resolveDocumentActions = defaultResolveDocumentActions,
    resolveStructure = defaultResolveStructure,
  } = props.tool.options

  const {
    data: {resolveStructureDocumentNode = defaultResolveDocumentNode},
  } = useConfig()

  const {builder: S} = useStructure()

  const components = useMemo(() => {
    return {
      LanguageFilter: componentsOption?.LanguageFilter,
    }
  }, [componentsOption])

  const routerState = useRouterState()

  const structure = useMemo(() => validateStructure(resolveStructure(S)), [resolveStructure, S])

  const intent = isString(routerState.intent) ? routerState.intent : undefined
  const params = isRecord(routerState.params) ? routerState.params : {}
  const payload = routerState.payload

  useEffect(() => {
    // Set active panes to blank on mount and unmount
    setActivePanes([])
    return () => setActivePanes([])
  }, [])

  const [error, setError] = useState<Error | null>(null)
  const handleCatch: ErrorBoundaryProps['onCatch'] = useCallback((e) => {
    setError(e.error)
  }, [])

  const resolveDocumentNode: DocumentNodeResolver = useCallback(
    (_S, documentOptions) => {
      const documentNode = resolveStructureDocumentNode(S, documentOptions)

      if (!documentNode) return S.defaultDocument(documentOptions)

      const isBuilder = typeof (documentNode as DocumentBuilder).serialize === 'function'

      if (!isBuilder && (documentNode as unknown as DocumentNode).type !== 'document') {
        throw new Error('`getDefaultDocumentNode` must return a document or a document builder')
      }

      return isBuilder
        ? (documentNode as DocumentBuilder)
        : new DocumentBuilder(documentNode as unknown as DocumentNode)
    },
    [resolveStructureDocumentNode, S]
  )

  if (error) return <StructureError error={error} />

  return (
    <ErrorBoundary onCatch={handleCatch}>
      {intent ? (
        <IntentResolver
          intent={intent}
          params={params}
          payload={payload}
          resolveDocumentNode={resolveDocumentNode}
        />
      ) : (
        <DeskTool
          components={components}
          onPaneChange={setActivePanes}
          resolveDocumentActions={resolveDocumentActions}
          resolveDocumentNode={resolveDocumentNode}
          structure={structure}
          structureBuilder={S}
        />
      )}
    </ErrorBoundary>
  )
}
