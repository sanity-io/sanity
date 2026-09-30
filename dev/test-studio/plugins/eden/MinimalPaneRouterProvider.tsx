import {type PropsWithChildren, useCallback, useMemo, useState} from 'react'
import {useRouter, useRouterState} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'

type PaneParams = Record<string, string | undefined>

function notImplemented(name: string): () => void {
  return () => {
    console.warn(`[eden] ${name} is only available inside the structure tool`)
  }
}

function NoLink(): null {
  return null
}

function selectSearchParams(state: {_searchParams?: [string, string][]}): [string, string][] {
  return state._searchParams ?? []
}

/**
 * The document pane keeps inspector and view state in its pane params, so a form rendered outside
 * the structure tool needs somewhere to put them. Search params rather than local state, so that
 * history and review changes stay deep-linkable.
 */
export function MinimalPaneRouterProvider({children}: PropsWithChildren): React.JSX.Element {
  const router = useRouter()
  const searchParams = useRouterState(selectSearchParams)
  const [payload, setPayloadState] = useState<unknown>({})

  const params = useMemo(() => Object.fromEntries(searchParams), [searchParams])

  const setParams = useCallback(
    (nextParams: PaneParams) => {
      const entries = Object.entries(nextParams).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      )
      router.navigate({...router.state, _searchParams: entries})
    },
    [router],
  )

  const setView = useCallback(
    (viewId: string | null) => setParams({...params, view: viewId ?? undefined}),
    [params, setParams],
  )

  const context: PaneRouterContextValue = useMemo(
    () => ({
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload,
      params,
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: NoLink,
      // No BackLink: any BackLink renders a close-pane button, and this form has nowhere to go back to.
      ReferenceChildLink: NoLink,
      ParameterizedLink: NoLink,
      closeCurrentAndAfter: notImplemented('closeCurrentAndAfter'),
      handleEditReference: notImplemented('handleEditReference'),
      replaceCurrent: notImplemented('replaceCurrent'),
      closeCurrent: notImplemented('closeCurrent'),
      duplicateCurrent: notImplemented('duplicateCurrent'),
      setView,
      setParams,
      setPayload: setPayloadState,
      navigateIntent: router.navigateIntent,
      createPathWithParams: () => '',
    }),
    [params, payload, router.navigateIntent, setParams, setView],
  )

  return <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
}
