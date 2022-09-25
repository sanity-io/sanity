import {createContext} from 'react'
import {UserColorManager} from './types'

export const UserColorManagerContext = createContext<UserColorManager | null>(null)
