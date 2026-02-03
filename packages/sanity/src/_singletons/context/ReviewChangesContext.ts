import type {ConnectorContextValue} from '../../core/changeIndicators/ConnectorContext'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const ReviewChangesContext = createContext<ConnectorContextValue>(
  'sanity/_singletons/context/review-changes',
  {
    onOpenReviewChanges: () => undefined,
    onSetFocus: () => undefined,
    isReviewChangesOpen: false,
    isInteractive: true,
  },
)
