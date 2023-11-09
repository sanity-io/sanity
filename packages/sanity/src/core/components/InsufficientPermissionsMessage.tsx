import {AccessDeniedIcon} from '@sanity/icons'
import {CurrentUser} from '@sanity/types'
import {Text, Inline, Box} from '@sanity/ui'
import React, {Fragment, useCallback} from 'react'
import {startCase} from 'lodash'
// note: these are both available from the `../i18n` export but importing through
// that export fails the build. may be due to a circular reference.
import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'
import {useIntlListFormat} from '../i18n/hooks/useIntlListFormat'

/** @internal */
export interface InsufficientPermissionsMessageProps {
  currentUser?: CurrentUser | null
  action: string
}

const EMPTY_ARRAY = [] as never[]

/** @internal */
export function InsufficientPermissionsMessage(props: InsufficientPermissionsMessageProps) {
  const {t} = useTranslation()
  const {currentUser, action} = props

  const list = useIntlListFormat({style: 'short', type: 'unit'})
  const roles = currentUser?.roles || EMPTY_ARRAY

  const Roles = useCallback(
    () => (
      <>
        {list
          .formatToParts(roles.map((role) => role.title || startCase(role.name)))
          .map((i, index) =>
            i.type === 'element' ? (
              // eslint-disable-next-line react/no-array-index-key
              <code key={`${i.value}-${index}`}>{i.value}</code>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <Fragment key={`${i.value}-${index}`}>{i.value}</Fragment>
            ),
          )}
      </>
    ),
    [roles, list],
  )

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
          <Translate
            i18nKey="insufficient-permissions-message.not-authorized"
            t={t}
            values={{action}}
          />
        </Text>
      </Inline>
      <Inline marginTop={4} marginBottom={1}>
        <Text size={1}>
          <Translate i18nKey="insufficient-permissions-message.roles" t={t} components={{Roles}} />
        </Text>
      </Inline>
    </Box>
  )
}
