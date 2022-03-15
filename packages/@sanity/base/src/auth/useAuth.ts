import {useContext} from 'react'
import {AuthContext} from './AuthContext'
import {AuthContextValue} from './types'

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext)

  if (!auth) {
    throw new Error('Auth: missing context value')
  }

  return auth
}
