import React from 'react'
import {Path} from '@sanity/types'
import {EMPTY_ARRAY} from './constants'

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

const initial: ChangeIndicatorContext = {
  path: EMPTY_ARRAY,
  fullPath: EMPTY_ARRAY,
  focusPath: EMPTY_ARRAY,
}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContext> = React.createContext(
  initial
)
