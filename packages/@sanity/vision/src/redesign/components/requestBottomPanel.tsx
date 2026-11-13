import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react'

import {type BottomPanelState} from './SplitWithBottomPanel'

const INITIAL_STATE: BottomPanelState = {
  activeTabId: 'params',
  collapsed: false,
  bottomSizes: {},
}

interface RequestBottomPanelContextValue {
  state: BottomPanelState
  setState: Dispatch<SetStateAction<BottomPanelState>>
}

const RequestBottomPanelContext = createContext<RequestBottomPanelContextValue | null>(null)

/**
 * The request column's bottom panel, held above the query tab so it survives switching tabs.
 * The tab remounts with each query tab; Lint and Functions would otherwise snap back to Params.
 */
export function RequestBottomPanelProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<BottomPanelState>(INITIAL_STATE)
  const value = useMemo(() => ({state, setState}), [state])
  return <RequestBottomPanelContext value={value}>{children}</RequestBottomPanelContext>
}

export function useRequestBottomPanel(): RequestBottomPanelContextValue {
  const value = useContext(RequestBottomPanelContext)
  if (!value) {
    throw new Error('useRequestBottomPanel must be used within a RequestBottomPanelProvider')
  }
  return value
}
