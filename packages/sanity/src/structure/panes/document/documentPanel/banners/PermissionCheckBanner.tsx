import {ReadOnlyIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useState} from 'react'
import {Translate, useCurrentUser, useListFormat, useTranslation} from 'sanity'

import {RequestPermissionDialog} from '../../../../components/requestPermissionDialog/RequestPermissionDialog'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

interface PermissionCheckBannerProps {
  granted: boolean
  requiredPermission: 'update' | 'create'
}

export function PermissionCheckBanner({granted, requiredPermission}: PermissionCheckBannerProps) {
  const currentUser = useCurrentUser()

  const currentUserRoles = currentUser?.roles || []
  const isOnlyViewer = currentUserRoles.length === 1 && currentUserRoles[0].name === 'viewer'
  const [showRequestPermissionDialog, setShowDialog] = useState(false)

  const listFormat = useListFormat({style: 'short'})
  const {t} = useTranslation(structureLocaleNamespace)

  if (granted) return null

  const roleTitles = currentUserRoles.map((role) => role.title)
  const roles = listFormat
    .formatToParts(roleTitles)
    .map((part) =>
      part.type === 'element' ? <code key={part.value}>{part.value}</code> : part.value,
    )

  return (
    <>
      <Banner
        content={
          <Text size={1} weight="medium">
            <Translate
              t={t}
              i18nKey="banners.permission-check-banner.missing-permission"
              components={{Roles: () => <>{roles}</>}}
              values={{count: roles.length, roles: roleTitles}}
              context={requiredPermission}
            />
          </Text>
        }
        action={
          isOnlyViewer
            ? {
                onClick: () => setShowDialog(true),
                text: t('banners.permission-check-banner.request-permission-button.text'),
                tone: 'primary',
              }
            : undefined
        }
        data-testid="permission-check-banner"
        icon={ReadOnlyIcon}
      />
      {showRequestPermissionDialog && (
        <RequestPermissionDialog
          onClose={() => setShowDialog(false)}
          onRequestSubmitted={() => setShowDialog(false)}
        />
      )}
    </>
  )
}
