import {useCurrentUser} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {Tooltip} from '@sanity/ui'
import React from 'react'

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
  const {value: currentUser} = useCurrentUser()

  if (!reveal) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={loading ? 'Loading…' : <InsufficientPermissionsMessage currentUser={currentUser} />}
      portal
    >
      {/* this wrapping div is to allow mouse events */}
      {/* while the child element is disabled */}
      <div>{children}</div>
    </Tooltip>
  )
}
