import React from 'react'
import {UserColorManagerContext} from './context'
import {UserColorManager} from './types'

interface UserColorManagerProviderProps {
  children: React.ReactNode
  manager: UserColorManager
}

export function UserColorManagerProvider({
  children,
  manager,
}: UserColorManagerProviderProps): React.ReactElement {
  return React.createElement(UserColorManagerContext.Provider, {value: manager}, children)
}
