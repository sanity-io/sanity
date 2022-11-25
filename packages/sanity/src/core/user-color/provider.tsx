import React, {useMemo} from 'react'
import {UserColorManagerContext} from './context'
import {UserColorManager} from './types'
import {createUserColorManager} from './manager'

/** @internal */
export interface UserColorManagerProviderProps {
  children: React.ReactNode
  manager?: UserColorManager
}

/** @internal */
export function UserColorManagerProvider({
  children,
  manager: managerFromProps,
}: UserColorManagerProviderProps): React.ReactElement {
  const manager = useMemo(() => {
    return managerFromProps || createUserColorManager()
  }, [managerFromProps])

  return (
    <UserColorManagerContext.Provider value={manager}>{children}</UserColorManagerContext.Provider>
  )
}
