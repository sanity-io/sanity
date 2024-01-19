import {AccessDeniedIcon} from '@sanity/icons'
import type {CurrentUser} from '@sanity/types'
import {Box, Inline, Text} from '@sanity/ui'
import {startCase} from 'lodash'
import {Fragment, useCallback} from 'react'
import {useListFormat} from '../hooks/useListFormat'
// note: these are both available from the `../i18n` export but importing through
// that export fails the build. may be due to a circular reference.
import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'

/** @internal */
export interface InsufficientPermissionsMessageProps {
  currentUser?: CurrentUser | null
  context:
    | 'create-new-reference'
    | 'create-document-type'
    | 'create-any-document'
    | 'create-document'
    | 'delete-document'
    | 'discard-changes'
    | 'duplicate-document'
    | 'publish-document'
    | 'unpublish-document'
}

const EMPTY_ARRAY = [] as never[]

/** @internal */
export function InsufficientPermissionsMessage({
  currentUser,
  context,
}: InsufficientPermissionsMessageProps) {
  const {t} = useTranslation()

  const list = useListFormat({style: 'short', type: 'unit'})
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
    <Box>
      <Inline space={2}>
        <Text size={0}>
          <AccessDeniedIcon />
        </Text>
        <Text size={1} weight="medium">
          {t('insufficient-permissions-message.title')}
        </Text>
      </Inline>
      <Inline marginTop={4}>
        <Text size={1}>
          <Translate
            i18nKey="insufficient-permissions-message.not-authorized-explanation"
            t={t}
            context={context}
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
