import {createContext} from 'react'
import {userColorManager} from './singleton'
import {UserColorManager} from './types'

export const UserColorManagerContext = createContext<UserColorManager>(userColorManager)
