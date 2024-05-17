import {createContext} from 'react'

import type {UserColorManager} from '../../../core/user-color/types'

/**
 * @internal
 */
export const UserColorManagerContext = createContext<UserColorManager | null>(null)
