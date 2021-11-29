import {createContext} from 'react'
import {userColorManager} from './singleton'
import type {UserColorManager} from './types'

export const UserColorManagerContext = createContext<UserColorManager>(userColorManager)
