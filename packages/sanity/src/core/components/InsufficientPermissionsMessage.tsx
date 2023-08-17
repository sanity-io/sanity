import {AccessDeniedIcon} from '@sanity/icons'
import {CurrentUser} from '@sanity/types'
import {Text, Inline, Box} from '@sanity/ui'
import React from 'react'

/** @internal */
export interface InsufficientPermissionsMessageProps {
  title?: string
  operationLabel?: string
  currentUser?: CurrentUser | null
}

/** @internal */
export function InsufficientPermissionsMessage(props: InsufficientPermissionsMessageProps) {
  const {
    currentUser,
    title = 'Insufficient permissions',
    operationLabel = 'access this feature',
  } = props

  const roles = currentUser?.roles || []
  const plural = roles.length !== 1

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
          {roles.length === 0 ? (
            <>You have no role that grants you permission to {operationLabel}</>
          ) : (
            <>
              Your role{plural && 's'}{' '}
              {join(
                roles.map((r) => <code key={r.name}>{r.title}</code>),
                <>, </>,
              )}{' '}
              do{plural || 'es'} not have permissions to {operationLabel}
            </>
          )}
        </Text>
      </Inline>
    </Box>
  )
}

function join(array: React.ReactElement[], sep: React.ReactElement) {
  return array.reduce<React.ReactElement[] | null>(
    (result, item) => (result === null ? [item] : [...result, sep, item]),
    null,
  )
}
