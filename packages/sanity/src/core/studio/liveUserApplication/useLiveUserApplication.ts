import {use} from 'react'
import {LiveUserApplicationContext} from 'sanity/_singletons'

export function useLiveUserApplication() {
  return use(LiveUserApplicationContext)
}
