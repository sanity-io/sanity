import {AccessDeniedIcon} from '@sanity/icons'
import {CurrentUser} from '@sanity/types'
import {Text, Inline, Box} from '@sanity/ui'
import React from 'react'
// note: these are both available from the `../i18n` export but importing through
// that export fails the build. may be due to a circular reference.
import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'

/** @internal */
export interface InsufficientPermissionsMessageProps {
  operationLabel?: string
  currentUser?: CurrentUser | null
}

/** @internal */
export function InsufficientPermissionsMessage(props: InsufficientPermissionsMessageProps) {
  const {t} = useTranslation()
  const {
    currentUser,
    operationLabel = t('insufficient-permissions-message.default-operation-label'),
  } = props

  const roles = currentUser?.roles || []

  return (
    <Box padding={2}>
      <Inline space={2}>
        <Text size={1}>
          <AccessDeniedIcon />
        </Text>
        <Text weight="semibold">{t('insufficient-permissions-message.title')}</Text>
      </Inline>
      <Inline marginTop={4}>
        <Text size={1}>
          {roles.length === 0 ? (
            t('insufficient-permissions-message.no-roles', {operationLabel})
          ) : (
            <Translate
              i18nKey="insufficient-permissions-message.has-roles"
              t={t}
              components={{
                Roles: () =>
                  join(
                    roles.map((r) => <code key={r.name}>{r.title}</code>),
                    <>, </>,
                  ),
              }}
              values={{operationLabel, count: roles.length}}
            />
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
