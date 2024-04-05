import {createContext} from 'react'
import type {UserColorManager} from 'sanity'

/**
 * @internal
 */
export const UserColorManagerContext = createContext<UserColorManager | null>(null)
