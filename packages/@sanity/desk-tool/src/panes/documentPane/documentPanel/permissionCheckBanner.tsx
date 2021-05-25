import React from 'react'
import {Box, Card, Flex, Text, Inline} from '@sanity/ui'

import {ReadOnlyIcon} from '@sanity/icons'

interface Props {
  requiredPermission: string
  permission: {granted: boolean; reason: string}
  currentUser?: {roles: {name: string; title: string}[]}
}

export function PermissionCheckBanner(props: Props) {
  const {permission, requiredPermission, currentUser} = props
  const plural = currentUser?.roles.length !== 1
  return permission.granted ? null : (
    <Card tone="transparent" padding={2} paddingX={3} shadow={1}>
      <Flex padding={2} align="center">
        <Box>
          <Text size={0}>
            <ReadOnlyIcon />
          </Text>
        </Box>
        <Box flex={1} marginLeft={3}>
          <Inline space={2}>
            <Text size={1}>
              Your role{plural && 's'}{' '}
              {join(
                currentUser?.roles?.map((r) => <code key={r.name}>{r.title}</code>),
                ', '
              )}{' '}
              do{plural || 'es'} not have permissions to {requiredPermission} this document
            </Text>
          </Inline>
        </Box>
      </Flex>
    </Card>
  )
}

function join(array, sep) {
  return array.reduce((result, item) => (result === null ? [item] : [...result, sep, item]), null)
}
