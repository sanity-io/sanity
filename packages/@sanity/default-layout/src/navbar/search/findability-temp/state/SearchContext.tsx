import React, {createContext, Dispatch, PropsWithChildren, useContext} from 'react'
import {INITIAL_SEARCH_STATE, SearchAction, SearchState, useSearchReducer} from './search-reducer'

export interface SearchContextValue {
  state: SearchState
  dispatch: Dispatch<SearchAction>
}

export const SearchStateContext = createContext(INITIAL_SEARCH_STATE)
// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
export const SearchDispatchContext = createContext<Dispatch<SearchAction>>(() => {})

export function useSearchState() {
  return useContext(SearchStateContext)
}

export function useSearchDispatch() {
  return useContext(SearchDispatchContext)
}

export function SearchContextProvider(props: PropsWithChildren<Record<never, never>>) {
  const [state, dispatch] = useSearchReducer()
  return (
    <SearchStateContext.Provider value={state}>
      <SearchDispatchContext.Provider value={dispatch}>
        {props.children}
      </SearchDispatchContext.Provider>
    </SearchStateContext.Provider>
  )
}
