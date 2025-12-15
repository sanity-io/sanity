import debugit from 'debug'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {LiveUserApplicationContext} from 'sanity/_singletons'

import {type UserApplication, useUserApplicationCache} from '../../store/userApplications'
import {useWorkspaces} from '../workspaces'
import {findUserApplication} from './liveUserApplication'

const debug = debugit('studio:live-user-application')

/** @internal */
interface LiveUserApplicationProviderProps {
  children: ReactNode
}

/**
 * Provider that automatically uploads the studio manifest when the Studio loads.
 * This runs once when all workspaces are available and includes all workspace information.
 *
 * @internal
 */
export function LiveUserApplicationProvider({children}: LiveUserApplicationProviderProps) {
  const [userApplication, setUserApplication] = useState<UserApplication | undefined>(undefined)

  const workspaces = useWorkspaces()
  const userApplicationCache = useUserApplicationCache()

  useEffect(() => {
    let hasSubscriber = true
    findUserApplication(userApplicationCache, workspaces)
      .then((found) => {
        if (hasSubscriber) {
          setUserApplication(found)
        }
      })
      .catch((error) => {
        debug('Error when determining live user application id:', error)
        if (hasSubscriber) {
          setUserApplication(undefined)
        }
      })
    return () => {
      hasSubscriber = false
    }
  }, [userApplicationCache, workspaces])

  const contextValue = useMemo(
    () => ({
      userApplication,
    }),
    [userApplication],
  )
  return (
    <LiveUserApplicationContext.Provider value={contextValue}>
      {children}
    </LiveUserApplicationContext.Provider>
  )
}
