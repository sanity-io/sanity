import {useEffect, useState} from 'react'
import {SourceProvider, type Tool, useWorkspace} from 'sanity'
import {recordStructureTool} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {type RouterState, useRouterState} from 'sanity/router'

import {ErrorBoundary} from '../../../ui-components/errorBoundary/ErrorBoundary'
import {setActivePanes} from '../../getIntentState'
import {StructureToolProvider} from '../../StructureToolProvider'
import {type StructureToolOptions} from '../../types'
import {IntentResolver} from './intentResolver/IntentResolver'
import {StructureError} from './StructureError'
import {StructureTool} from './StructureTool'

interface StructureToolBoundaryProps {
  tool: Tool<StructureToolOptions>
}

export function StructureToolBoundary({
  tool: {name: toolName, options},
}: StructureToolBoundaryProps) {
  const {unstable_sources: sources} = useWorkspace()
  const [firstSource] = sources
  const {source, defaultDocumentNode, structure} = options || {}

  // Set active panes to blank on mount and unmount
  useEffect(() => {
    setActivePanes([])
    return () => setActivePanes([])
  }, [])

  useEffect(() => {
    recordStructureTool(toolName)
  }, [toolName])

  const routerState = useRouterState()
  const [caught, setCaught] = useState<{error: unknown; routerState: RouterState} | null>(null)
  const error = caught?.routerState === routerState ? caught.error : null

  // this re-throws if the error it catches is not a PaneResolutionError
  if (error) return <StructureError error={error} onReload={() => setCaught(null)} />

  return (
    <ErrorBoundary onCatch={({error: caughtError}) => setCaught({error: caughtError, routerState})}>
      <SourceProvider name={source || firstSource.name}>
        <StructureToolProvider defaultDocumentNode={defaultDocumentNode} structure={structure}>
          <StructureTool onPaneChange={setActivePanes} toolName={toolName} />
          <IntentResolver />
        </StructureToolProvider>
      </SourceProvider>
    </ErrorBoundary>
  )
}
