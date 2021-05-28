import {Text, Inline, Box} from '@sanity/ui'
import React from 'react'
import {AccessDeniedIcon} from '@sanity/icons'

export interface InsufficientPermissionsMessageProps {
  title?: string
  operationLabel?: string
  currentUser?: {roles: {name: string; title: string}[]}
}

export function InsufficientPermissionsMessage(props: InsufficientPermissionsMessageProps) {
  const {
    currentUser,
    title = 'Insufficient permissions',
    operationLabel = 'access this feature',
  } = props
  const plural = currentUser?.roles.length !== 1
  return (
    <Box padding={2}>
      <Inline space={2}>
        <Text size={1}>
          <AccessDeniedIcon />
        </Text>
        <Text weight="semibold">{title}</Text>
      </Inline>
      <Inline marginTop={4}>
        <Text size={1}>
          Your role{plural && 's'}{' '}
          {join(
            currentUser?.roles?.map((r) => <code key={r.name}>{r.title}</code>),
            ', '
          )}{' '}
          do{plural || 'es'} not have permissions to {operationLabel}
        </Text>
      </Inline>
    </Box>
  )
}

function join(array, sep) {
  return array.reduce((result, item) => (result === null ? [item] : [...result, sep, item]), null)
}
