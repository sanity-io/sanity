import {useContext} from 'react'
import {InternalRouter} from './components/types'
import {RouterContext} from './RouterContext'

export function useRouter(): InternalRouter {
  return useContext(RouterContext)
}
