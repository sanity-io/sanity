import {createContext} from 'react'

import type {ConnectorContextValue} from '../../../core/changeIndicators/ConnectorContext'

/** @internal */
export const ConnectorContext = createContext<ConnectorContextValue>({
  isReviewChangesOpen: false,
  onOpenReviewChanges: () => undefined,
  onSetFocus: () => undefined,
} as ConnectorContextValue)
