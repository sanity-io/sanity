import {createContext} from 'react'

import type {ConnectorContextValue} from '../../core/changeIndicators/ConnectorContext'

/** @internal */
export const ReviewChangesContext = createContext<ConnectorContextValue>({
  onOpenReviewChanges: () => undefined,
  onSetFocus: () => undefined,
  isReviewChangesOpen: false,
  isInteractive: true,
})
