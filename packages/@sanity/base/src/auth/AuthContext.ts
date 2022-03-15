import {createContext} from 'react'
import {AuthContextValue} from './types'

export const AuthContext = createContext<AuthContextValue | null>(null)
