import {GlobalPresence} from '@sanity/components/presence'
import {useGlobalPresence} from '@sanity/base/hooks'
import client from 'part:@sanity/base/client'
import React from 'react'

export function GlobalPresenceStatus() {
  const {projectId} = client.config()
  const presence = useGlobalPresence()
  return <GlobalPresence presence={presence} projectId={projectId} />
}
