import React from 'react'
import {Observable, throwError} from 'rxjs'

interface PositionTrackerEvent {
  type: 'mount' | 'unmount'
  key: string
  element?: HTMLElement
}

interface Rect {
  height: number
  width: number
  top: number
  bottom: number
  left: number
  right: number
}

export interface Position {
  key: string
  rect: Rect
}

interface OverlayerContext {
  dispatch: (event: PositionTrackerEvent) => void
  // recalc: () => void
  __positions$: Observable<Position>
}

const DEFAULT_CONTEXT: OverlayerContext = {
  dispatch: (event: PositionTrackerEvent) => {
    throw new Error('Missing context')
  },
  // recalc: () => {
  //   throw new Error('Missing context')
  // },
  __positions$: throwError(new Error('Missing context'))
}

export const Context: React.Context<OverlayerContext> = React.createContext(DEFAULT_CONTEXT)
