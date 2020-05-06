import {GlobalStatus} from '@sanity/components/presence'
import {useGlobalPresence} from '@sanity/base/hooks'
import client from 'part:@sanity/base/client'
import React from 'react'

export function GlobalPresence() {
  const {projectId} = client.config()
  const presence = useGlobalPresence()
  return <GlobalStatus presence={presence} projectId={projectId} />
}
