import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react'

import {useVisionActor, type VisionLayout} from '../store/VisionActorContext'
import {isPanelExpanded} from '../store/visionMachine'
import {type BottomPanelState} from './SplitWithBottomPanel'

const INITIAL_REQUEST_PANEL: BottomPanelState = {
  activeTabId: 'options',
  collapsed: false,
  bottomSizes: {},
}

/** Collapsed, so the result gets the whole column until a tab is picked */
const INITIAL_RESPONSE_PANEL: BottomPanelState = {
  activeTabId: 'response',
  collapsed: true,
  bottomSizes: {},
}

/** The request pane's size along the split, dragged per layout */
export type SplitSizes = Partial<Record<VisionLayout, number>>

/** The params section under the query: whether it is collapsed, and its height dragged per layout */
export interface ParamsSectionState {
  collapsed: boolean
  sizes: Partial<Record<VisionLayout, number>>
}

interface BottomPanelValue {
  state: BottomPanelState
  setState: Dispatch<SetStateAction<BottomPanelState>>
}

interface ParamsSectionValue {
  state: ParamsSectionState
  setSizes: Dispatch<SetStateAction<ParamsSectionState['sizes']>>
  /** Collapses or expands the section, and stores that for the next visit */
  setCollapsed: (collapsed: boolean) => void
}

interface QueryTabLayoutContextValue {
  request: BottomPanelValue
  response: BottomPanelValue
  params: ParamsSectionValue
  splitSizes: SplitSizes
  setSplitSizes: Dispatch<SetStateAction<SplitSizes>>
  /** Whether the split holds equal halves, in every layout, until it is dragged off them */
  splitSnapped: boolean
  setSplitSnapped: Dispatch<SetStateAction<boolean>>
}

const QueryTabLayoutContext = createContext<QueryTabLayoutContextValue | null>(null)

/**
 * How the query tab is laid out: the request and response split, the params section under the
 * query, and each column's bottom panel (its open tab, whether it is collapsed, its height). Held
 * above the query tab, which remounts with each query tab, so switching or opening a tab keeps
 * the layout instead of snapping back to the defaults.
 */
export function QueryTabLayoutProvider({children}: {children: ReactNode}) {
  const actorRef = useVisionActor()
  const [requestState, setRequestState] = useState<BottomPanelState>(INITIAL_REQUEST_PANEL)
  const [responseState, setResponseState] = useState<BottomPanelState>(INITIAL_RESPONSE_PANEL)
  // Held as React state, so collapsing and expanding can animate as a transition; the stored
  // flag in the machine only seeds it and follows it
  const [paramsState, setParamsState] = useState<ParamsSectionState>(() => ({
    collapsed: !isPanelExpanded(actorRef.getSnapshot(), 'params'),
    sizes: {},
  }))
  const [splitSizes, setSplitSizes] = useState<SplitSizes>({})
  const [splitSnapped, setSplitSnapped] = useState(false)
  const setParamsSizes = useCallback((update: SetStateAction<ParamsSectionState['sizes']>) => {
    setParamsState((current) => ({
      ...current,
      sizes: typeof update === 'function' ? update(current.sizes) : update,
    }))
  }, [])
  const setParamsCollapsed = useCallback(
    (collapsed: boolean) => {
      setParamsState((current) =>
        current.collapsed === collapsed ? current : {...current, collapsed},
      )
      if (isPanelExpanded(actorRef.getSnapshot(), 'params') === collapsed) {
        actorRef.send({type: 'panel.toggle', panel: 'params'})
      }
    },
    [actorRef],
  )
  const value = useMemo(
    (): QueryTabLayoutContextValue => ({
      request: {state: requestState, setState: setRequestState},
      response: {state: responseState, setState: setResponseState},
      params: {state: paramsState, setSizes: setParamsSizes, setCollapsed: setParamsCollapsed},
      splitSizes,
      setSplitSizes,
      splitSnapped,
      setSplitSnapped,
    }),
    [
      paramsState,
      requestState,
      responseState,
      setParamsCollapsed,
      setParamsSizes,
      splitSizes,
      splitSnapped,
    ],
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

export function useParamsSection(): ParamsSectionValue {
  return useQueryTabLayout().params
}

export function useQueryTabSplitSizes(): Pick<
  QueryTabLayoutContextValue,
  'splitSizes' | 'setSplitSizes' | 'splitSnapped' | 'setSplitSnapped'
> {
  const {splitSizes, setSplitSizes, splitSnapped, setSplitSnapped} = useQueryTabLayout()
  return {splitSizes, setSplitSizes, splitSnapped, setSplitSnapped}
}
