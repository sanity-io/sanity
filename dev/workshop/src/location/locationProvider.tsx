import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {getNewState, getStateFromAnchor, getStateFromWindow, getUrlFromState} from './helpers'
import {LocationContext} from './locationContext'

interface LocationProviderProps {
  children?: React.ReactNode
}

export function LocationProvider(props: LocationProviderProps): React.ReactElement {
  const {children} = props
  const [state, setState] = useState(getStateFromWindow)
  const stateRef = useRef(state)
  const segments = useMemo(() => state.path.split('/').slice(1).filter(Boolean), [state.path])

  useEffect(() => {
    const handlePopState = () => setState(getStateFromWindow())

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const pushState = useCallback((params) => {
    const newState = getNewState(stateRef.current, params)
    const url = getUrlFromState(newState)

    window.history.pushState(null, newState.title, url)

    setState(newState)
  }, [])

  const replaceState = useCallback((params) => {
    const newState = getNewState(stateRef.current, params)
    const url = getUrlFromState(newState)

    window.history.replaceState(null, newState.title, url)

    setState(newState)
  }, [])

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
        const target = event.currentTarget as HTMLAnchorElement | null

        if (target) {
          event.preventDefault()
          pushState(getStateFromAnchor(target))
        }
      }
    },
    [pushState]
  )

  const contextValue = useMemo(
    () => ({...state, handleLinkClick, pushState, replaceState, segments}),
    [handleLinkClick, pushState, replaceState, segments, state]
  )

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>
}
