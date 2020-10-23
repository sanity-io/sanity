import React from 'react'
import {Path} from '@sanity/types'

interface ChangeIndicatorContext {
  value?: any
  compareValue?: any
  focusPath: Path
  path: Path
  fullPath: Path
}

export interface ConnectorContext {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (nextPath: Path) => void
}
export const ConnectorContext: React.Context<ConnectorContext> = React.createContext({
  isReviewChangesOpen: false as boolean,
  onOpenReviewChanges: () => {},
  onSetFocus: (nextPath: Path) => {},
})

const initial: ChangeIndicatorContext = {path: [], fullPath: [], focusPath: []}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContext> = React.createContext(
  initial
)
