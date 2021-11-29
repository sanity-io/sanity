import {useContext} from 'react'
import type {InternalRouter} from './components/types'
import {RouterContext} from './RouterContext'

export function useRouter(): InternalRouter {
  return useContext(RouterContext)
}
