import {createContext} from 'react'
import type {UserColorManager} from 'sanity'

export const UserColorManagerContext = createContext<UserColorManager | null>(null)
