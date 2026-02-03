import {useEffect, useState} from 'react'
import {SourceProvider, type Tool, useWorkspace} from 'sanity'

import {ErrorBoundary} from '../../../ui-components/errorBoundary'
import {setActivePanes} from '../../getIntentState'
import {StructureToolProvider} from '../../StructureToolProvider'
import {type StructureToolOptions} from '../../types'
import {IntentResolver} from './intentResolver'
import {StructureError} from './StructureError'
import {StructureTool} from './StructureTool'

interface StructureToolBoundaryProps {
  tool: Tool<StructureToolOptions>
}

export function StructureToolBoundary({tool: {options}}: StructureToolBoundaryProps) {
  const {unstable_sources: sources} = useWorkspace()
  const [firstSource] = sources
  const {source, defaultDocumentNode, structure} = options || {}

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
        <StructureToolProvider defaultDocumentNode={defaultDocumentNode} structure={structure}>
          <StructureTool onPaneChange={setActivePanes} />
          <IntentResolver />
        </StructureToolProvider>
      </SourceProvider>
    </ErrorBoundary>
  )
}
