import {ReadOnlyIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {Translate, useCurrentUser, useListFormat, useTranslation} from 'sanity'

import {
  RequestPermissionDialog,
  useRoleRequestsStatus,
} from '../../../../components/requestPermissionDialog'
import {AskToEditDialogOpened} from '../../../../components/requestPermissionDialog/__telemetry__/RequestPermissionDialog.telemetry'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

interface InsufficientPermissionBannerProps {
  requiredPermission: 'update' | 'create'
}

export function InsufficientPermissionBanner({
  requiredPermission,
}: InsufficientPermissionBannerProps) {
  const currentUser = useCurrentUser()

  const {
    data: roleRequestStatus,
    loading: requestStatusLoading,
    error: requestStatusError,
  } = useRoleRequestsStatus()
  const [requestSent, setRequestSent] = useState(false)
  const requestPending = useMemo(
    () => roleRequestStatus === 'pending' || roleRequestStatus === 'declined' || requestSent,
    [roleRequestStatus, requestSent],
  )
  const currentUserRoles = currentUser?.roles || []
  const isOnlyViewer = currentUserRoles.length === 1 && currentUserRoles[0].name === 'viewer'
  const [showRequestPermissionDialog, setShowRequestPermissionDialog] = useState(false)

  const listFormat = useListFormat({style: 'short'})
  const {t} = useTranslation(structureLocaleNamespace)
  const telemetry = useTelemetry()

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
          isOnlyViewer && roleRequestStatus && !requestStatusError && !requestStatusLoading
            ? {
                onClick: requestPending
                  ? undefined
                  : () => {
                      setShowRequestPermissionDialog(true)
                      telemetry.log(AskToEditDialogOpened)
                    },
                text: requestPending
                  ? t('banners.permission-check-banner.request-permission-button.sent')
                  : t('banners.permission-check-banner.request-permission-button.text'),
                tone: requestPending ? 'default' : 'primary',
                disabled: requestPending,
                mode: requestPending ? 'bleed' : undefined,
              }
            : undefined
        }
        data-testid="permission-check-banner"
        icon={ReadOnlyIcon}
      />
      {showRequestPermissionDialog && (
        <RequestPermissionDialog
          onClose={() => setShowRequestPermissionDialog(false)}
          onRequestSubmitted={() => {
            setRequestSent(true)
            setShowRequestPermissionDialog(false)
          }}
        />
      )}
    </>
  )
}
