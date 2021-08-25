import {useContext} from 'react'
import {LocationContext} from './locationContext'
import type {LocationContextValue} from './types'

export function useLocation(): LocationContextValue {
  return useContext(LocationContext)
}
