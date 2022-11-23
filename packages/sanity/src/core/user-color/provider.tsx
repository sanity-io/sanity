import React, {useMemo} from 'react'
import {useColorScheme} from '../studio'
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
  const {scheme} = useColorScheme()

  const manager = useMemo(() => {
    return managerFromProps || createUserColorManager({scheme})
  }, [managerFromProps, scheme])

  return (
    <UserColorManagerContext.Provider value={manager}>{children}</UserColorManagerContext.Provider>
  )
}
