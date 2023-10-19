import {Text} from '@sanity/ui'
import React from 'react'
import {Tooltip} from '../../../ui'
import {useCurrentUser, InsufficientPermissionsMessage} from 'sanity'

interface InsufficientPermissionsMessageTooltipProps {
  reveal: boolean
  loading: boolean
  children: React.ReactNode
}

export function InsufficientPermissionsMessageTooltip({
  reveal,
  loading,
  children,
}: InsufficientPermissionsMessageTooltipProps) {
  const currentUser = useCurrentUser()

  if (!reveal) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={
        loading ? (
          <Text>Loading…</Text>
        ) : (
          <InsufficientPermissionsMessage currentUser={currentUser} />
        )
      }
      portal
    >
      {/* this wrapping div is to allow mouse events */}
      {/* while the child element is disabled */}
      <div>{children}</div>
    </Tooltip>
  )
}
