import React from 'react'
import {TooltipWithNodes} from '../../../ui'
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
    <TooltipWithNodes
      content={loading ? 'Loading…' : <InsufficientPermissionsMessage currentUser={currentUser} />}
      portal
    >
      {/* this wrapping div is to allow mouse events */}
      {/* while the child element is disabled */}
      <div>{children}</div>
    </TooltipWithNodes>
  )
}
