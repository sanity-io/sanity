import {type Path} from '@sanity/types'
import {createContext} from 'react'

/** @internal */
export interface ConnectorContextValue {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void | undefined
  onSetFocus: (nextPath: Path) => void | undefined
}

/** @internal */
export const ConnectorContext = createContext<ConnectorContextValue>({
  isReviewChangesOpen: false,
  onOpenReviewChanges: () => undefined,
  onSetFocus: () => undefined,
} as ConnectorContextValue)
