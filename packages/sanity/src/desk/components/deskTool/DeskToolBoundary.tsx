import React, {useState} from 'react'
import {ErrorBoundary} from '@sanity/ui'
import {DeskToolOptions} from '../../types'
import {DeskToolProvider} from '../../DeskToolProvider'
import {IntentResolver} from './intentResolver'
import {StructureError} from './StructureError'
import {DeskTool} from './DeskTool'
import {SourceProvider, useWorkspace, Tool} from 'sanity'

interface DeskToolBoundaryProps {
  tool: Tool<DeskToolOptions>
}

export function DeskToolBoundary({tool: {options}}: DeskToolBoundaryProps) {
  const {unstable_sources: sources} = useWorkspace()
  const [firstSource] = sources
  const {source, defaultDocumentNode, structure} = options || {}
  const [{error}, setError] = useState<{error: unknown}>({error: null})
  // this re-throws if the error it catches is not a PaneResolutionError
  if (error) return <StructureError error={error} />

  return (
    <ErrorBoundary onCatch={setError}>
      <SourceProvider name={source || firstSource.name}>
        <DeskToolProvider defaultDocumentNode={defaultDocumentNode} structure={structure}>
          <DeskTool />
          <IntentResolver />
        </DeskToolProvider>
      </SourceProvider>
    </ErrorBoundary>
  )
}
