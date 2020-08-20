import React, {createContext, useContext} from 'react'
import {UserColorManager} from './types'
import {userColorManager} from './singleton'

interface ProviderProps {
  children: React.ReactNode
  manager: UserColorManager
}

const UserColorManagerContext = createContext<UserColorManager>(userColorManager)

export function useUserColorManager(): UserColorManager {
  return useContext(UserColorManagerContext)
}

export function UserColorManagerProvider({children, manager}: ProviderProps) {
  return React.createElement(UserColorManagerContext.Provider, {value: manager}, children)
}
