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
  const [isLoading, setIsLoading] = useState(true)

  const workspaces = useWorkspaces()
  const userApplicationCache = useUserApplicationCache()

  useEffect(() => {
    let hasSubscriber = true
    setIsLoading(true)
    findUserApplication(userApplicationCache, workspaces)
      .then((found) => {
        if (hasSubscriber) {
          setUserApplication(found)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        debug('Error when determining live user application id:', error)
        if (hasSubscriber) {
          setUserApplication(undefined)
          setIsLoading(false)
        }
      })
    return () => {
      hasSubscriber = false
    }
  }, [userApplicationCache, workspaces])

  const contextValue = useMemo(
    () => ({
      userApplication,
      isLoading,
    }),
    [userApplication, isLoading],
  )
  return (
    <LiveUserApplicationContext.Provider value={contextValue}>
      {children}
    </LiveUserApplicationContext.Provider>
  )
}
