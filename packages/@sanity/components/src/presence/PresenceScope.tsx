import * as PathUtils from '@sanity/util/paths'
import React from 'react'
import {Context} from './context'
import {EMPTY_PATH, EMPTY_PRESENCE} from './constants'
import {PathSegment} from './types'

function trimChildPath(path: PathSegment[], childPath: PathSegment[]): PathSegment[] {
  if (path.length === 0) {
    return EMPTY_PATH
  }
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : EMPTY_PATH
}

interface Props {
  readOnly: boolean
  path: PathSegment[]
  children: React.ReactNode
}

export function PresenceScope(props: Props) {
  const {readOnly, path, children} = props
  const contextPresence = React.useContext(Context)
  const childPresence =
    readOnly || !contextPresence || contextPresence.length === 0
      ? EMPTY_PRESENCE
      : contextPresence
          .filter(presence => PathUtils.startsWith(path, presence.path))
          .map(presence => ({
            ...presence,
            path: trimChildPath(path, presence.path)
          }))
  return <Context.Provider value={childPresence}>{children}</Context.Provider>
}
