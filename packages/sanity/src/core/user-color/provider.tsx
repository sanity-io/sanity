import {type ReactNode, useMemo} from 'react'
import {UserColorManagerContext} from 'sanity/_singletons'

import {useColorSchemeValue} from '../studio'
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
}: UserColorManagerProviderProps): React.JSX.Element {
  const scheme = useColorSchemeValue()

  const manager = useMemo(() => {
    return managerFromProps || createUserColorManager({scheme})
  }, [managerFromProps, scheme])

  return (
    <UserColorManagerContext.Provider value={manager}>{children}</UserColorManagerContext.Provider>
  )
}
