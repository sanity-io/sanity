import {dequal} from 'dequal/lite'
import omit from 'lodash-es/omit.js'
import {useCallback, useEffect, useState} from 'react'
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

interface CaughtError {
  error: unknown
  navigationTarget: Partial<RouterState> | null
}

const NO_ERROR: CaughtError = {error: null, navigationTarget: null}

function selectNavigationTarget(routerState: RouterState) {
  return omit(routerState, ['_searchParams'])
}

export function StructureToolBoundary({
  tool: {name: toolName, options},
}: StructureToolBoundaryProps) {
  const {unstable_sources: sources} = useWorkspace()
  const [firstSource] = sources
  const {source, defaultDocumentNode, structure} = options || {}
  const navigationTarget = useRouterState(selectNavigationTarget)

  // Set active panes to blank on mount and unmount
  useEffect(() => {
    setActivePanes([])
    return () => setActivePanes([])
  }, [])

  useEffect(() => {
    recordStructureTool(toolName)
  }, [toolName])

  const [caught, setCaught] = useState<CaughtError>(NO_ERROR)
  const handleCatch = useCallback(
    ({error}: {error: unknown}) => {
      setActivePanes([])
      setCaught({error, navigationTarget})
    },
    [navigationTarget],
  )
  const handleReload = useCallback(() => setCaught(NO_ERROR), [])
  const isOnFailedRoute = dequal(caught.navigationTarget, navigationTarget)

  // the intent resolver sits below the boundary, so navigating must clear the error for it to run
  if (caught.error && isOnFailedRoute) {
    // this re-throws if the error it catches is not a PaneResolutionError
    return <StructureError error={caught.error} onReload={handleReload} />
  }
  if (caught.error) setCaught(NO_ERROR)

  return (
    <ErrorBoundary onCatch={handleCatch}>
      <SourceProvider name={source || firstSource.name}>
        <StructureToolProvider defaultDocumentNode={defaultDocumentNode} structure={structure}>
          <StructureTool onPaneChange={setActivePanes} toolName={toolName} />
          <IntentResolver />
        </StructureToolProvider>
      </SourceProvider>
    </ErrorBoundary>
  )
}
