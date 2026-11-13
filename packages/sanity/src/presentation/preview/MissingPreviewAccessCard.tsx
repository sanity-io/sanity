import {type Role} from '@sanity/types'
import {type CardProps} from '@sanity/ui'
import {useListFormat, useTranslation} from 'sanity'

import {ErrorCard} from '../components/ErrorCard'
import {presentationLocaleNamespace} from '../i18n'

export function MissingPreviewAccessCard(
  props: {
    roles: Role[] | undefined
    onContinueAnyway: () => void
  } & Omit<CardProps, 'children'>,
): React.JSX.Element {
  const {roles, onContinueAnyway, ...restProps} = props
  const {t} = useTranslation(presentationLocaleNamespace)
  const listFormat = useListFormat({style: 'long', type: 'conjunction'})
  const roleTitles = (roles ?? []).map((role) => role.title || role.name).filter(Boolean)

  return (
    <ErrorCard
      {...restProps}
      data-testid="presentation-missing-preview-access"
      title={t('preview-frame.missing-permissions.title')}
      message={t('preview-frame.missing-permissions.description', {
        context: roleTitles.length > 0 ? 'roles' : undefined,
        roles: listFormat.format(roleTitles),
      })}
      continueAnywayText={t('preview-frame.missing-permissions.continue-button.text')}
      onContinueAnyway={onContinueAnyway}
    />
  )
}
