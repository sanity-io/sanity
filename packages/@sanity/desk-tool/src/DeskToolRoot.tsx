import {SanityTool, useConfig} from '@sanity/base'
import {useRouterState} from '@sanity/base/router'
import {StructureBuilder} from '@sanity/structure'
import {ErrorBoundary, ErrorBoundaryProps} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {IntentResolver} from './components/intentResolver'
import {MissingDocumentTypesMessage} from './components/MissingDocumentTypesMessage'
import {StructureError} from './components/StructureError'
import {DeskTool} from './DeskTool'
import {setActivePanes} from './getIntentState'
import {isRecord, isString} from './helpers'
import {UnresolvedPaneNode} from './types'
import {validateStructure} from './utils/loadStructure'

export interface DeskToolOptions {
  resolveStructure?: (S: StructureBuilder) => UnresolvedPaneNode
}

export default function DeskToolRoot(props: {tool: SanityTool<DeskToolOptions>}) {
  const {resolveStructure} = props.tool.options
  const {structureBuilder: S} = useConfig()
  const routerState = useRouterState() || {}

  const structure = useMemo(() => {
    let s = null

    if (resolveStructure) {
      s = resolveStructure(S as any)
    } else {
      s = S.defaults()

      const paneItems = s.getItems()

      if (paneItems?.length === 0) {
        s = S.component({
          id: 'empty-list-pane',
          component: MissingDocumentTypesMessage,
        })
      }
    }

    return validateStructure(s)
  }, [S, resolveStructure])

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

  const resolveDocumentNode = useCallback(
    (options: {documentId?: string; schemaType: string}) => S.defaultDocument(options),
    [S]
  )

  if (error) return <StructureError error={error} />

  return (
    <ErrorBoundary onCatch={handleCatch}>
      {intent ? (
        <IntentResolver intent={intent} params={params as any} payload={payload} />
      ) : (
        <DeskTool
          onPaneChange={setActivePanes}
          resolveDocumentNode={resolveDocumentNode as any}
          structure={structure}
        />
      )}
    </ErrorBoundary>
  )
}
