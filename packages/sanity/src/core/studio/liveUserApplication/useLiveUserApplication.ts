import {useContext} from 'react'
import {LiveUserApplicationContext} from 'sanity/_singletons'

export function useLiveUserApplication() {
  return useContext(LiveUserApplicationContext)
}
