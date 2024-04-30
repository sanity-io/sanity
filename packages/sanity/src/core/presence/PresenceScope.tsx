import {type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {type ReactNode, useContext, useMemo} from 'react'
import {FormFieldPresenceContext} from 'sanity/_singletons'

const EMPTY_ARRAY: never[] = []

function trimChildPath(path: Path, childPath: Path) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : EMPTY_ARRAY
}

/** @internal */
export interface PresenceScopeProps {
  readOnly?: boolean
  path: Path
  children: ReactNode
}

/** @internal */
export function PresenceScope(props: PresenceScopeProps) {
  const {readOnly, path, children} = props
  const contextPresence = useContext(FormFieldPresenceContext)

  const childPresence = useMemo(() => {
    return readOnly
      ? EMPTY_ARRAY
      : (contextPresence || EMPTY_ARRAY)
          .filter((presence) => {
            return PathUtils.startsWith(path, presence.path)
          })
          .map((presence) => ({
            ...presence,
            path: trimChildPath(path, presence.path),
          }))
  }, [contextPresence, path, readOnly])

  return (
    <FormFieldPresenceContext.Provider value={childPresence}>
      {children}
    </FormFieldPresenceContext.Provider>
  )
}
