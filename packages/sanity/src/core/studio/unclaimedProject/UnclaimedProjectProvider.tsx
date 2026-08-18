import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {UnclaimedProjectContext, type UnclaimedProjectContextValue} from 'sanity/_singletons'

import {isDev} from '../../environment'
import {useWorkspace} from '../workspace'
import {ROBOT_PROVIDER, useUnclaimedProject} from './useUnclaimedProject'

const emptyContextValue: UnclaimedProjectContextValue = {
  onClaim: () => undefined,
  state: undefined,
}

/** @internal */
export function UnclaimedProjectProvider({children}: {children: ReactNode}) {
  if (!isDev) return children

  return <DevUnclaimedProjectProvider>{children}</DevUnclaimedProjectProvider>
}

function DevUnclaimedProjectProvider({children}: {children: ReactNode}) {
  const {currentUser} = useWorkspace()

  if (currentUser?.provider !== ROBOT_PROVIDER) {
    return (
      <UnclaimedProjectContext.Provider value={emptyContextValue}>
        {children}
      </UnclaimedProjectContext.Provider>
    )
  }

  return <RobotUnclaimedProjectProvider>{children}</RobotUnclaimedProjectProvider>
}

function RobotUnclaimedProjectProvider({children}: {children: ReactNode}) {
  const {projectId} = useWorkspace()
  const [claimAttempt, setClaimAttempt] = useState<{projectId: string; startedAt: number}>()
  const claimAttemptedAt =
    claimAttempt?.projectId === projectId ? claimAttempt.startedAt : undefined
  const state = useUnclaimedProject({claimAttemptedAt})
  const onClaim = useCallback(
    () => setClaimAttempt({projectId, startedAt: Date.now()}),
    [projectId],
  )
  const value = useMemo(() => ({onClaim, state}), [onClaim, state])

  return (
    <UnclaimedProjectContext.Provider value={value}>{children}</UnclaimedProjectContext.Provider>
  )
}

/** @internal */
export function useUnclaimedProjectContext(): UnclaimedProjectContextValue {
  return useContext(UnclaimedProjectContext)
}
