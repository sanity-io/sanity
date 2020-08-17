import React, {createContext, useContext} from 'react'
import {UserColorManager} from './types'

interface ProviderProps {
  children: React.ReactNode
  manager: UserColorManager
}

const UserColorManagerContext = createContext<UserColorManager | null>(null)

export function useUserColorManager(): UserColorManager {
  const manager = useContext(UserColorManagerContext)

  if (!manager) {
    throw new Error(`missing user color manager in context`)
  }

  return manager
}

export function UserColorManagerProvider({children, manager}: ProviderProps) {
  return React.createElement(UserColorManagerContext.Provider, {value: manager}, children)
}
