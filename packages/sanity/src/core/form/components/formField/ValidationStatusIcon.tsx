import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Icon, type IconProps} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {errorIcon, infoIcon, warningIcon} from './ValidationStatusIcon.css'

function ValidationErrorIcon(props: Omit<IconProps, 'icon'>) {
  const {t} = useTranslation()
  return (
    <Icon
      icon={ErrorOutlineIcon}
      className={errorIcon}
      data-testid="input-validation-icon-error"
      aria-label={t('form.validation.has-error-aria-label')}
      aria-hidden
      role="presentation"
      {...props}
    />
  )
}

function ValidationWarningIcon(props: Omit<IconProps, 'icon'>) {
  const {t} = useTranslation()
  return (
    <Icon
      icon={WarningOutlineIcon}
      className={warningIcon}
      data-testid="input-validation-icon-warning"
      aria-label={t('form.validation.has-warning-aria-label')}
      aria-hidden
      role="presentation"
      {...props}
    />
  )
}

function ValidationInfoIcon(props: Omit<IconProps, 'icon'>) {
  const {t} = useTranslation()
  return (
    <Icon
      icon={InfoOutlineIcon}
      className={infoIcon}
      data-testid="input-validation-icon-info"
      aria-label={t('form.validation.has-info-aria-label')}
      aria-hidden
      role="presentation"
      {...props}
    />
  )
}

const VALIDATION_ICONS = {
  error: ValidationErrorIcon,
  warning: ValidationWarningIcon,
  info: ValidationInfoIcon,
}

export const StatusIcon = ({
  status,
  ...rest
}: Omit<IconProps, 'icon'> & {status: 'error' | 'warning' | 'info'}) => {
  const ValidationIcon = VALIDATION_ICONS[status]
  if (!ValidationIcon) return null

  return <ValidationIcon {...rest} />
}
