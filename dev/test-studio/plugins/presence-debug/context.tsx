import {type Path} from '@sanity/types'
import {createContext, type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {type PresenceLocation} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {PresenceDebugDialog} from './PresenceDebugDialog'

/** Where the fake presence should be placed */
export interface PresenceDebugTarget {
  documentId: string
  /** The field the action was triggered on */
  path: Path
  /**
   * A more precise location inside the field, e.g. the cursor inside a Portable Text editor.
   * When set, the fake presence is placed there instead of at the field.
   */
  location?: PresenceLocation
}

interface PresenceDebugContextValue {
  open: (target: PresenceDebugTarget) => void
}

const PresenceDebugContext = createContext<PresenceDebugContextValue | null>(null)

export function usePresenceDebug(): PresenceDebugContextValue {
  const value = useContext(PresenceDebugContext)
  if (!value) {
    throw new Error('usePresenceDebug: the presence-debug plugin is not enabled')
  }
  return value
}

/** Hosts the dialog the field action opens; mounted once at the studio layout level */
export function PresenceDebugProvider(props: {children: ReactNode}) {
  const [target, setTarget] = useState<PresenceDebugTarget | null>(null)
  const close = useCallback(() => setTarget(null), [])
  const value = useMemo(() => ({open: setTarget}), [])

  return (
    <PresenceDebugContext.Provider value={value}>
      {props.children}
      {target && <PresenceDebugDialog target={target} onClose={close} />}
    </PresenceDebugContext.Provider>
  )
}
