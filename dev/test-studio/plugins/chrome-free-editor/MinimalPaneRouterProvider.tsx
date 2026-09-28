import {type PropsWithChildren, useMemo} from 'react'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'

function notImplemented(name: string): () => void {
  return () => {
    console.warn(`[chrome-free-editor] ${name} is not available outside the structure tool`)
  }
}

function NoLink(): null {
  return null
}

export function MinimalPaneRouterProvider({children}: PropsWithChildren): React.JSX.Element {
  const context: PaneRouterContextValue = useMemo(
    () => ({
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload: {},
      params: {},
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: NoLink,
      BackLink: NoLink,
      ReferenceChildLink: NoLink,
      ParameterizedLink: NoLink,
      closeCurrentAndAfter: notImplemented('closeCurrentAndAfter'),
      handleEditReference: notImplemented('handleEditReference'),
      replaceCurrent: notImplemented('replaceCurrent'),
      closeCurrent: notImplemented('closeCurrent'),
      duplicateCurrent: notImplemented('duplicateCurrent'),
      setView: notImplemented('setView'),
      setParams: notImplemented('setParams'),
      setPayload: notImplemented('setPayload'),
      navigateIntent: notImplemented('navigateIntent'),
      createPathWithParams: () => '',
    }),
    [],
  )

  return <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
}
