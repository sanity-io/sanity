import React, {useEffect, useMemo, useState} from 'react'
import {ErrorBoundary} from '@sanity/ui'
import {DeskToolOptions} from '../../types'
import {DeskToolProvider} from '../../DeskToolProvider'
import {setActivePanes} from '../../getIntentState'
import {IntentResolver} from './intentResolver'
import {StructureError} from './StructureError'
import {DeskTool} from './DeskTool'
import {useRouter} from 'sanity/router'
import {SourceProvider, useWorkspace, Tool, isRecord} from 'sanity'

const EMPTY_RECORD = {}

interface DeskToolBoundaryProps {
  tool: Tool<DeskToolOptions>
}

export function DeskToolBoundary({tool: {options}}: DeskToolBoundaryProps) {
  const {unstable_sources: sources} = useWorkspace()
  const [firstSource] = sources
  const {source, defaultDocumentNode, structure} = options || {}

  const {state: routerState} = useRouter()
  const intent = useMemo(() => {
    const intentName = typeof routerState.intent === 'string' ? routerState.intent : undefined
    const params = isRecord(routerState.params) ? routerState.params : EMPTY_RECORD
    const payload = routerState.payload

    return intentName ? {intent: intentName, params, payload} : undefined
  }, [routerState])

  // Set active panes to blank on mount and unmount
  useEffect(() => {
    setActivePanes([])
    return () => setActivePanes([])
  }, [])

  const [{error}, setError] = useState<{error: unknown}>({error: null})
  // this re-throws if the error it catches is not a PaneResolutionError
  if (error) return <StructureError error={error} />

  return (
    <ErrorBoundary onCatch={setError}>
      <SourceProvider name={source || firstSource.name}>
        <DeskToolProvider defaultDocumentNode={defaultDocumentNode} structure={structure}>
          {/* when an intent is found, we render the intent resolver component */}
          {/* which asynchronously resolves the intent then navigates to it */}
          {intent ? <IntentResolver {...intent} /> : <DeskTool onPaneChange={setActivePanes} />}
        </DeskToolProvider>
      </SourceProvider>
    </ErrorBoundary>
  )
}
