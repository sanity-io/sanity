import {Tooltip, Text, Box} from '@sanity/ui'
import React from 'react'
import {deskLocaleNamespace} from '../../i18n'
import {useCurrentUser, useTranslation, InsufficientPermissionsMessage} from 'sanity'

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
  const {t} = useTranslation(deskLocaleNamespace)

  if (!reveal) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={
        loading ? (
          <Box padding={2}>
            <Text>{t('desk-tool.insufficient-permissions-message-tooltip.loading')}</Text>
          </Box>
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
