import {createContext} from 'react'

import {type UserColorManager} from './types'

export const UserColorManagerContext = createContext<UserColorManager | null>(null)
