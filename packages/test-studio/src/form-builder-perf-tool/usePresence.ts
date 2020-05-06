import {useEffect, useState} from 'react'
import {clients$} from 'part:@sanity/base/presence'
import * as PathUtils from '@sanity/util/paths.js'
import {distinctUntilChanged} from 'rxjs/operators'

type KeyedSegment = {
  _key: string
}

type PathSegment = string | number | KeyedSegment

type Path = PathSegment[]

interface PresenceFilter {
  namespace: string
  documentId: string
  path?: Path
}

export default function usePresence(filter: PresenceFilter) {
  const [presence, setPresence] = useState([])
  useEffect(() => {
    const subscription = clients$.pipe(distinctUntilChanged()).subscribe(clients => {
      setPresence(
        clients.filter(client =>
          client.sessions.some(
            session =>
              session.state &&
              session.state.some(
                item =>
                  item.namespace === filter.namespace &&
                  item.documentId === filter.documentId &&
                  (!filter.path || PathUtils.startsWith(filter.path, item.path))
              )
          )
        )
      )
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [filter.documentId, filter.namespace, filter.path])
  return presence
}
