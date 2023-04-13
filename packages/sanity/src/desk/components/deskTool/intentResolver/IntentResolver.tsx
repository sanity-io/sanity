import {memo, useCallback, useEffect, useState} from 'react'
import {resolveIntent} from '../../../structureResolvers'
import {useDeskTool} from '../../../useDeskTool'
import {ensureDocumentIdAndType} from './utils'
import {useRouter, useRouterState} from 'sanity/router'
import {isRecord, useDocumentStore} from 'sanity'

const EMPTY_RECORD: Record<string, unknown> = {}

/**
 * A component that receives an intent from props and redirects to the resolved
 * intent location (while showing a loading spinner during the process)
 */
export const IntentResolver = memo(function IntentResolver() {
  const {navigate} = useRouter()
  const maybeIntent = useRouterState(
    useCallback((routerState) => {
      const intentName = typeof routerState.intent === 'string' ? routerState.intent : undefined
      return intentName
        ? {
            intent: intentName,
            params: isRecord(routerState.params) ? routerState.params : EMPTY_RECORD,
            payload: routerState.payload,
          }
        : undefined
    }, [])
  )
  const {rootPaneNode, structureContext} = useDeskTool()
  const documentStore = useDocumentStore()
  const [error, setError] = useState<unknown>(null)

  // this re-throws errors so that parent ErrorBoundary's can handle them properly
  if (error) throw error

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (maybeIntent) {
      const {intent, params, payload} = maybeIntent

      let cancelled = false
      // eslint-disable-next-line no-inner-declarations
      async function effect() {
        const {id, type} = await ensureDocumentIdAndType(
          documentStore,
          typeof params.id === 'string' ? params.id : undefined,
          typeof params.type === 'string' ? params.type : undefined
        )

        if (cancelled) return

        const panes = await resolveIntent({
          intent,
          params: {...params, id, type},
          payload,
          rootPaneNode,
          structureContext,
        })

        if (cancelled) return

        navigate({panes}, {replace: true})
      }

      effect().catch(setError)

      return () => {
        cancelled = true
      }
    }
  }, [documentStore, maybeIntent, navigate, rootPaneNode, structureContext])

  return null
})
