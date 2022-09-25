import {createContext} from 'react'
import {Path} from '@sanity/types'

export interface ConnectorContextValue {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void | undefined
  onSetFocus: (nextPath: Path) => void | undefined
}

export const ConnectorContext = createContext<ConnectorContextValue>({
  isReviewChangesOpen: false,
  onOpenReviewChanges: () => undefined,
  onSetFocus: () => undefined,
} as ConnectorContextValue)
