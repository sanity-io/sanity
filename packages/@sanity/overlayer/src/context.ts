import * as React from 'react'
import {Rect} from './types'

export interface BoxMountEvent {
  type: 'mount'
  id: string
  element: Element
  children: React.ReactNode
}

export interface BoxUnmountEvent {
  type: 'unmount'
  id: string
}

export interface BoxUpdateEvent {
  type: 'update'
  id: string
  children: React.ReactNode
}

export type BoxEvent = BoxMountEvent | BoxUpdateEvent | BoxUnmountEvent

export interface Position {
  id: string
  rect: Rect
}

interface OverlayerContext {
  dispatch: (event: BoxEvent) => void
}

const DEFAULT_CONTEXT: OverlayerContext = {
  dispatch: (event: BoxEvent) => {
    throw new Error('Missing context')
  }
}

export const Context: React.Context<OverlayerContext> = React.createContext(DEFAULT_CONTEXT)
