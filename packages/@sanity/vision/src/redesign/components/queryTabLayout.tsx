import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  use,
  useMemo,
  useState,
} from 'react'

import {type VisionLayout} from '../store/VisionActorContext'
import {type BottomPanelState} from './SplitWithBottomPanel'

const INITIAL_REQUEST_PANEL: BottomPanelState = {
  activeTabId: 'params',
  collapsed: false,
  bottomSizes: {},
}

const INITIAL_RESPONSE_PANEL: BottomPanelState = {
  activeTabId: 'response',
  collapsed: false,
  bottomSizes: {},
}

/** The request pane's size along the split, dragged per layout */
export type SplitSizes = Partial<Record<VisionLayout, number>>

interface BottomPanelValue {
  state: BottomPanelState
  setState: Dispatch<SetStateAction<BottomPanelState>>
}

interface QueryTabLayoutContextValue {
  request: BottomPanelValue
  response: BottomPanelValue
  splitSizes: SplitSizes
  setSplitSizes: Dispatch<SetStateAction<SplitSizes>>
}

const QueryTabLayoutContext = createContext<QueryTabLayoutContextValue | null>(null)

/**
 * How the query tab is laid out: the request and response split, and each column's bottom panel
 * (its open tab, whether it is collapsed, its height). Held above the query tab, which remounts
 * with each query tab, so switching or opening a tab keeps the layout instead of snapping back to
 * the defaults.
 */
export function QueryTabLayoutProvider({children}: {children: ReactNode}) {
  const [requestState, setRequestState] = useState<BottomPanelState>(INITIAL_REQUEST_PANEL)
  const [responseState, setResponseState] = useState<BottomPanelState>(INITIAL_RESPONSE_PANEL)
  const [splitSizes, setSplitSizes] = useState<SplitSizes>({})
  const value = useMemo(
    (): QueryTabLayoutContextValue => ({
      request: {state: requestState, setState: setRequestState},
      response: {state: responseState, setState: setResponseState},
      splitSizes,
      setSplitSizes,
    }),
    [requestState, responseState, splitSizes],
  )
  return <QueryTabLayoutContext value={value}>{children}</QueryTabLayoutContext>
}

function useQueryTabLayout(): QueryTabLayoutContextValue {
  const value = use(QueryTabLayoutContext)
  if (!value) {
    throw new Error('Query tab layout hooks must be used within a QueryTabLayoutProvider')
  }
  return value
}

export function useRequestBottomPanel(): BottomPanelValue {
  return useQueryTabLayout().request
}

export function useResponseBottomPanel(): BottomPanelValue {
  return useQueryTabLayout().response
}

export function useQueryTabSplitSizes(): Pick<
  QueryTabLayoutContextValue,
  'splitSizes' | 'setSplitSizes'
> {
  const {splitSizes, setSplitSizes} = useQueryTabLayout()
  return {splitSizes, setSplitSizes}
}
