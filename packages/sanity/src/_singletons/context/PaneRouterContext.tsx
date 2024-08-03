import {createContext} from 'sanity/_createContext'

import type {PaneRouterContextValue} from '../../structure/components/paneRouter/types'

function missingContext<T = unknown>(): T {
  throw new Error('Pane is missing router context')
}

/**
 *
 * @hidden
 * @beta
 */
export const PaneRouterContext = createContext<PaneRouterContextValue>(
  'sanity/_singletons/context/pane-router',
  {
    index: 0,
    groupIndex: 0,
    siblingIndex: 0,
    payload: undefined,
    params: {},
    hasGroupSiblings: false,
    groupLength: 0,
    routerPanesState: [],
    BackLink: () => missingContext(),
    ChildLink: () => missingContext(),
    ReferenceChildLink: () => missingContext(),
    handleEditReference: () => missingContext(),
    ParameterizedLink: () => missingContext(),
    replaceCurrent: () => missingContext(),
    closeCurrentAndAfter: () => missingContext(),
    closeCurrent: () => missingContext(),
    duplicateCurrent: () => missingContext(),
    setView: () => missingContext(),
    setParams: () => missingContext(),
    setPayload: () => missingContext(),
    navigateIntent: () => missingContext(),
    createPathWithParams: () => missingContext(),
  },
)
