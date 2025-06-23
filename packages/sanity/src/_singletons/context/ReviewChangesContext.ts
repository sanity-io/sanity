import {createContext} from 'sanity/_createContext'

import type {ConnectorContextValue} from '../../core/changeIndicators/ConnectorContext'

/** @internal */
export const ReviewChangesContext: React.Context<ConnectorContextValue> =
  createContext<ConnectorContextValue>('sanity/_singletons/context/review-changes', {
    onOpenReviewChanges: () => undefined,
    onSetFocus: () => undefined,
    isReviewChangesOpen: false,
    isInteractive: true,
  })
