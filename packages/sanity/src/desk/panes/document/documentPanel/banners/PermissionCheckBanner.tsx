import React from 'react'
import {Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'
import {Translate, useCurrentUser, useIntlListFormat, useTranslation} from 'sanity'

interface PermissionCheckBannerProps {
  granted: boolean
  requiredPermission: 'update' | 'create'
}

export function PermissionCheckBanner({granted, requiredPermission}: PermissionCheckBannerProps) {
  const currentUser = useCurrentUser()
  const listFormat = useIntlListFormat({style: 'short'})
  const {t} = useTranslation(structureLocaleNamespace)

  if (granted) return null

  const roleTitles = (currentUser?.roles || []).map((role) => role.title)
  const roles = listFormat
    .formatToParts(roleTitles)
    .map((part) =>
      part.type === 'element' ? <code key={part.value}>{part.value}</code> : part.value,
    )

  return (
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
      data-testid="permission-check-banner"
      icon={ReadOnlyIcon}
    />
  )
}
