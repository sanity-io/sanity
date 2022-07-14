import React, {createContext, Dispatch, ReactNode, useContext, useReducer} from 'react'
import {
  INITIAL_SEARCH_STATE,
  omnisearchReducer,
  SearchAction,
  SearchReducerState,
} from './search-reducer'

interface OmnisearchContextValue {
  dispatch: Dispatch<SearchAction>
  onClose: () => void
  state: SearchReducerState
}

const OmnisearchContext = createContext<OmnisearchContextValue | undefined>(undefined)

function OmnisearchProvider({children, onClose}: {children?: ReactNode; onClose: () => void}) {
  const [state, dispatch] = useReducer(omnisearchReducer, INITIAL_SEARCH_STATE)
  return (
    <OmnisearchContext.Provider
      value={{
        dispatch,
        onClose,
        state,
      }}
    >
      {children}
    </OmnisearchContext.Provider>
  )
}

function useOmnisearch() {
  const context = useContext(OmnisearchContext)
  if (context === undefined) {
    throw new Error('useOmnisearch must be used within an OmnisearchProvider')
  }
  return context
}

export {OmnisearchProvider, useOmnisearch}
