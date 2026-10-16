import {createContext} from 'react'

import type {UnclaimedProjectState} from '../../core/studio/unclaimedProject/useUnclaimedProject'

/** @internal */
export interface UnclaimedProjectContextValue {
  onClaim: () => void
  state: UnclaimedProjectState | undefined
}

/** @internal */
export const UnclaimedProjectContext = createContext<UnclaimedProjectContextValue>({
  onClaim: () => undefined,
  state: undefined,
})
