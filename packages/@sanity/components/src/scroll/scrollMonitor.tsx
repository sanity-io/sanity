import React, {useCallback} from 'react'
import {useScroll} from './hooks'
import {ScrollContext} from './scrollContext'
import {ScrollEventHandler} from './types'

interface ScrollMonitorProps {
  onScroll: ScrollEventHandler
  children?: React.ReactNode
}

export function ScrollMonitor({onScroll, children}: ScrollMonitorProps) {
  const parentContext = useScroll()

  const handleScroll = useCallback(
    (event: Event) => {
      onScroll(event)

      if (parentContext.onScroll) {
        parentContext.onScroll(event)
      }
    },
    [parentContext, onScroll]
  )

  return (
    <ScrollContext.Provider value={{onScroll: handleScroll}}>{children}</ScrollContext.Provider>
  )
}
