import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'

import {useTranslation} from '../../../i18n'
import {errorIcon, infoIcon, warningIcon} from './ValidationStatusIcon.css'

function ValidationErrorIcon() {
  const {t} = useTranslation()
  return (
    <ErrorOutlineIcon
      className={errorIcon}
      data-testid="input-validation-icon-error"
      aria-label={t('form.validation.has-error-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}

function ValidationWarningIcon() {
  const {t} = useTranslation()
  return (
    <WarningOutlineIcon
      className={warningIcon}
      data-testid="input-validation-icon-warning"
      aria-label={t('form.validation.has-warning-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}

function ValidationInfoIcon() {
  const {t} = useTranslation()
  return (
    <InfoOutlineIcon
      className={infoIcon}
      data-testid="input-validation-icon-info"
      aria-label={t('form.validation.has-info-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}

const VALIDATION_ICONS = {
  error: ValidationErrorIcon,
  warning: ValidationWarningIcon,
  info: ValidationInfoIcon,
}

export const StatusIcon = ({status}: {status: 'error' | 'warning' | 'info'}) => {
  const Icon = VALIDATION_ICONS[status]
  if (!Icon) return null

  return <Icon />
}
