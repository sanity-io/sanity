import {createContext} from 'sanity/_createContext'

import type {UserColorManager} from '../../core/user-color/types'

/**
 * @internal
 */
export const UserColorManagerContext = createContext<UserColorManager | null>(
  'sanity/_singletons/context/user-color-manager',
  null,
)
