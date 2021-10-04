import {useRouterState} from '@sanity/base/router'
import {MasterDetailIcon} from '@sanity/icons'
import React, {useEffect, useMemo} from 'react'
import {IntentResolver} from '../components/intentResolver'
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

  return useMemo(
    () =>
      intent ? (
        <IntentResolver intent={intent} params={params} payload={payload} />
      ) : (
        <DeskTool onPaneChange={setActivePanes} />
      ),
    [intent, params, payload]
  )
}
