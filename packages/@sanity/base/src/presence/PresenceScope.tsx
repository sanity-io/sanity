import * as PathUtils from '@sanity/util/paths'
import React, {useMemo} from 'react'
import {FormFieldPresenceContext} from './context'

const EMPTY_ARRAY = []

function trimChildPath(path, childPath) {
  return PathUtils.startsWith(path, childPath) ? PathUtils.trimLeft(path, childPath) : EMPTY_ARRAY
}

interface Props {
  readOnly: boolean
  path: any[]
  children: React.ReactNode
}

export function PresenceScope(props: Props) {
  const {readOnly, path, children} = props
  const contextPresence = React.useContext(FormFieldPresenceContext)

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
