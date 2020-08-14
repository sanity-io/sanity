import * as PathUtils from '@sanity/util/paths'
import React from 'react'
import {Context} from './context'

function trimChildPath(path, childPath) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : []
}

interface Props {
  readOnly: boolean
  path: any[]
  children: React.ReactNode
}

export function PresenceScope(props: Props) {
  const {readOnly, path, children} = props
  const contextPresence = React.useContext(Context)
  const childPresence = readOnly
    ? []
    : (contextPresence || [])
        .filter(presence => {
          return PathUtils.startsWith(path, presence.path)
        })
        .map(presence => ({
          ...presence,
          path: trimChildPath(path, presence.path)
        }))
  return <Context.Provider value={childPresence}>{children}</Context.Provider>
}
