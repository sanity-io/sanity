import {route, useRouterState} from '@sanity/base/router'
import {MasterDetailIcon} from '@sanity/icons'
import React, {useEffect} from 'react'
import {IntentResolver} from '../components/IntentResolver'
import {DeskTool as DeskToolRoot} from '../DeskTool'
import {getIntentState, setActivePanes} from '../getIntentState'
import {legacyEditParamsToPath, legacyEditParamsToState, toPath, toState} from '../helpers'

function DeskToolPaneStateSyncer() {
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
    <DeskToolRoot onPaneChange={setActivePanes} />
  )
}

const router = route('/', [
  // "Asynchronous intent resolving" route
  route.intents('/intent'),

  // Legacy fallback route, will be redirected to new format
  route('/edit/:type/:editDocumentId', [
    route({
      path: '/:params',
      transform: {params: {toState: legacyEditParamsToState, toPath: legacyEditParamsToPath}},
    }),
  ]),

  // The regular path - when the intent can be resolved to a specific pane
  route({
    path: '/:panes',
    // Legacy URLs, used to handle redirects
    children: [route('/:action', route('/:legacyEditDocumentId'))],
    transform: {
      panes: {toState, toPath},
    },
  }),
])

function canHandleIntent(intentName: string, params: Record<string, string | undefined>) {
  return Boolean(
    (intentName === 'edit' && params.id) ||
      (intentName === 'create' && params.type) ||
      (intentName === 'create' && params.template)
  )
}

export default {
  router,
  canHandleIntent,
  getIntentState,
  title: 'Desk',
  name: 'desk',
  icon: MasterDetailIcon,
  component: DeskToolPaneStateSyncer,
}
