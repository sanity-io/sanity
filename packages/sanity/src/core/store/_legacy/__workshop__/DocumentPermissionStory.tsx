import {Box, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {useGrantsStore} from '../datastores'
import {PermissionCheckResult} from '../grants/types'

export default function DocumentPermissionStory() {
  const grantsStore = useGrantsStore()
  const [permission, setPermission] = useState<PermissionCheckResult | null>(null)

  useEffect(() => {
    const permission$ = grantsStore.checkDocumentPermission('update', {_id: 'test'})
    const sub = permission$.subscribe(setPermission)

    return () => {
      sub.unsubscribe()
    }
  }, [grantsStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="medium">
        <code>{`grantsStore.checkDocumentPermission(permissionName: DocumentValuePermission, document: SanityDocument)`}</code>
      </Text>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(permission, null, 2)}
        </Code>
      </Box>
    </Box>
  )
}
