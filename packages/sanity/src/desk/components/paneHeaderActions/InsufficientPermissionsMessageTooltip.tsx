import {Tooltip, Text, Box} from '@sanity/ui'
import React from 'react'
import {deskLocaleNamespace} from '../../i18n'
import {useCurrentUser, InsufficientPermissionsMessage, useTranslation} from 'sanity'

interface InsufficientPermissionsMessageTooltipProps {
  reveal: boolean
  action: string
  loading: boolean
  children: React.ReactNode
}

export function InsufficientPermissionsMessageTooltip({
  reveal,
  action,
  loading,
  children,
}: InsufficientPermissionsMessageTooltipProps) {
  const currentUser = useCurrentUser()
  const {t} = useTranslation(deskLocaleNamespace)

  if (!reveal) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={
        loading ? (
          <Box padding={2}>
            <Text>{t('insufficient-permissions-message-tooltip.loading-text')}</Text>
          </Box>
        ) : (
          <InsufficientPermissionsMessage action={action} currentUser={currentUser} />
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
