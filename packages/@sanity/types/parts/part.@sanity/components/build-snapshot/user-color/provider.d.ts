import React from 'react'
import {UserColorManager} from './types'
interface UserColorManagerProviderProps {
  children: React.ReactNode
  manager: UserColorManager
}
export declare function UserColorManagerProvider({
  children,
  manager,
}: UserColorManagerProviderProps): React.ReactElement
export {}
