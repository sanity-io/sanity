import {GlobalPresence} from '@sanity/components/lib/presence'
import {GlobalPresenceItem} from '@sanity/components/lib/presence/types'
import {useGlobalPresence} from '@sanity/base/hooks'
import client from 'part:@sanity/base/client'
import React from 'react'

export function GlobalPresenceStatus() {
  const {projectId} = client.config()
  // @todo figure out if these actually match
  const presence = useGlobalPresence() as GlobalPresenceItem[]
  return <GlobalPresence presence={presence} projectId={projectId} />
}
