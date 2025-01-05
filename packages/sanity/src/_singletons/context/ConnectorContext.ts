import {createContext} from 'sanity/_createContext'

import type {ConnectorContextValue} from '../../core/changeIndicators/ConnectorContext'

/** @internal */
export const ConnectorContext = createContext<ConnectorContextValue>(
  'sanity/_singletons/context/connector',
  {
    isReviewChangesOpen: false,
    onOpenReviewChanges: () => undefined,
    onSetFocus: () => undefined,
    isEnabled: true,
    isInteractive: true,
  } as ConnectorContextValue,
)
