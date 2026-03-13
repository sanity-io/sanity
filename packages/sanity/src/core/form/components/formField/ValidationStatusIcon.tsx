import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {getVarName, vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'

// TODO: ui-v4-migration - Replace the var with the new css variable
const StyledErrorOutlineIcon = styled(ErrorOutlineIcon)`
  ${getVarName(vars.color.muted.fg)}: vars.color.tinted.critical.fg[4];
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

// TODO: ui-v4-migration - Replace the var with the new css variable

const StyledWarningOutlineIcon = styled(WarningOutlineIcon)`
  ${getVarName(vars.color.muted.fg)}: vars.color.tinted.caution.fg[4];
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

// TODO: ui-v4-migration - Replace the var with the new css variable
const StyledInfoOutlineIcon = styled(InfoOutlineIcon)`
  ${getVarName(vars.color.muted.fg)}: vars.color.tinted.primary.fg[4];
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
