import React from 'react'
import {Path} from '@sanity/types'

export interface ConnectorContextValue {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void | undefined
  onSetFocus: (nextPath: Path) => void | undefined
}

export const ConnectorContext: React.Context<ConnectorContextValue> = React.createContext({
  isReviewChangesOpen: false,
  onOpenReviewChanges: () => undefined,
  onSetFocus: () => undefined,
} as ConnectorContextValue)
