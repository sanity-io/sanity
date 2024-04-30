import {type ReactElement, type ReactNode, useMemo} from 'react'
import {UserColorManagerContext} from 'sanity/_singletons'

import {useColorScheme} from '../studio'
import {createUserColorManager} from './manager'
import {type UserColorManager} from './types'

/** @internal */
export interface UserColorManagerProviderProps {
  children: ReactNode
  manager?: UserColorManager
}

/** @internal */
export function UserColorManagerProvider({
  children,
  manager: managerFromProps,
}: UserColorManagerProviderProps): ReactElement {
  const {scheme} = useColorScheme()

  const manager = useMemo(() => {
    return managerFromProps || createUserColorManager({scheme})
  }, [managerFromProps, scheme])

  return (
    <UserColorManagerContext.Provider value={manager}>{children}</UserColorManagerContext.Provider>
  )
}
