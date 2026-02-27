import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'

const StyledErrorOutlineIcon = styled(ErrorOutlineIcon)`
  --card-icon-color: var(--card-badge-critical-icon-color);
`
function ValidationErrorIcon() {
  const {t} = useTranslation()
  return (
    <StyledErrorOutlineIcon
      data-testid="input-validation-icon-error"
      aria-label={t('form.validation.has-error-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}

const StyledWarningOutlineIcon = styled(WarningOutlineIcon)`
  --card-icon-color: var(--card-badge-caution-icon-color);
`

function ValidationWarningIcon() {
  const {t} = useTranslation()
  return (
    <StyledWarningOutlineIcon
      data-testid="input-validation-icon-warning"
      aria-label={t('form.validation.has-warning-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}

const StyledInfoOutlineIcon = styled(InfoOutlineIcon)`
  --card-icon-color: var(--card-badge-primary-icon-color);
`
function ValidationInfoIcon() {
  const {t} = useTranslation()
  return (
    <StyledInfoOutlineIcon
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
