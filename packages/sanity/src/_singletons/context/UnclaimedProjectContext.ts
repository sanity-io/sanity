import {createContext} from 'sanity/_createContext'

import type {UnclaimedProjectState} from '../../core/studio/unclaimedProject/useUnclaimedProject'

/** @internal */
export interface UnclaimedProjectContextValue {
  onClaim: () => void
  state: UnclaimedProjectState | undefined
}

/** @internal */
export const UnclaimedProjectContext = createContext<UnclaimedProjectContextValue>(
  'sanity/_singletons/context/unclaimed-project',
  {
    onClaim: () => undefined,
    state: undefined,
  },
)
