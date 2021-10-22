import {useRouterState} from '@sanity/base/router'
import {MasterDetailIcon} from '@sanity/icons'
import React, {useEffect} from 'react'
import {ErrorBoundary} from 'react-error-boundary'
import {IntentResolver} from '../components/intentResolver'
import {StructureError} from '../components/StructureError'
import {DeskTool} from '../DeskTool'
import {getIntentState, setActivePanes} from '../getIntentState'
import {router} from '../router'

export default {
  router,
  canHandleIntent,
  getIntentState,
  title: 'Desk',
  name: 'desk',
  icon: MasterDetailIcon,
  component: DeskToolRoot,
}

function canHandleIntent(intentName: string, params: Record<string, string | undefined>) {
  return Boolean(
    (intentName === 'edit' && params.id) ||
      (intentName === 'create' && params.type) ||
      (intentName === 'create' && params.template)
  )
}

function DeskToolRoot() {
  const routerState = useRouterState()
  const {intent, params, payload} = routerState || {}

  useEffect(() => {
    // Set active panes to blank on mount and unmount
    setActivePanes([])
    return () => setActivePanes([])
  }, [])

  return intent ? (
    <IntentResolver intent={intent} params={params} payload={payload} />
  ) : (
    <ErrorBoundary FallbackComponent={StructureError}>
      <DeskTool onPaneChange={setActivePanes} />
    </ErrorBoundary>
  )
}
