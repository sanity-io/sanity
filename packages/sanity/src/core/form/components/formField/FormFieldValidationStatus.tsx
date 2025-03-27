import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {type FormNodeValidation} from '@sanity/types'
import {Box, Flex, type Placement, Stack, Text} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {type FontTextSize} from '@sanity/ui/theme'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useListFormat} from '../../../hooks'
import {useTranslation} from '../../../i18n'

const StatusIconWrapper = styled.div`
  left: 8px;
  position: relative;
  width: 25px;
`

/** @internal */
export interface FormFieldValidationStatusProps {
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_showSummary?: boolean
  fontSize?: FontTextSize
  placement?: Placement
}

const EMPTY_ARRAY: never[] = []

const VALIDATION_ICONS = {
  error: ValidationErrorIcon,
  warning: ValidationWarningIcon,
  info: ValidationInfoIcon,
}

const StyledStack = styled(Stack)`
  max-width: 200px;
`

const StatusText = styled(Text)<{$status: 'error' | 'warning' | 'info'}>(({$status}) => {
  if ($status === 'error') {
    return {[getVarName(vars.color.muted.fg)]: vars.color.solid.critical.bg[0]}
  }

  if ($status === 'warning') {
    return {[getVarName(vars.color.muted.fg)]: vars.color.solid.caution.bg[0]}
  }

  if ($status === 'info') {
    return {[getVarName(vars.color.muted.fg)]: vars.color.solid.primary.bg[0]}
  }

  return {}
})

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {validation = EMPTY_ARRAY, __unstable_showSummary: showSummary, fontSize, placement} = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info'
  const StatusIcon = VALIDATION_ICONS[status]

  return (
    <Tooltip
      content={
        <StyledStack gap={3}>
          {showSummary && <FormFieldValidationSummary validation={validation} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                <FormFieldValidationStatusItem key={itemIndex} validation={item} />
              ))}
            </>
          )}
        </StyledStack>
      }
      portal
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <StatusIconWrapper>
        <StatusText $status={status} size={fontSize} weight="medium">
          {StatusIcon && <StatusIcon />}
        </StatusText>
      </StatusIconWrapper>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {validation: FormNodeValidation}) {
  const {validation} = props

  const StatusIcon = VALIDATION_ICONS[validation.level]

  return (
    <Flex>
      <Box marginRight={2}>
        <StatusText $status={validation.level} size={1}>
          {StatusIcon && <StatusIcon />}
        </StatusText>
      </Box>
      <Box flex={1}>
        <Text size={1}>{validation.message}</Text>
      </Box>
    </Flex>
  )
}

function FormFieldValidationSummary({validation}: {validation: FormNodeValidation[]}) {
  const {t} = useTranslation()
  const listFormatter = useListFormat()

  const errorCount = validation.reduce(
    (count, item) => (item.level === 'error' ? count + 1 : count),
    0,
  )
  const warningCount = validation.reduce(
    (count, item) => (item.level === 'warning' ? count + 1 : count),
    0,
  )

  const hasErrors = errorCount > 0
  const hasWarnings = warningCount > 0

  if (!hasErrors && !hasWarnings) {
    return null
  }

  const errorText = hasErrors && t('form.validation.summary.errors-count', {count: errorCount})
  const warningText =
    hasWarnings && t('form.validation.summary.warnings-count', {count: warningCount})

  return errorText && warningText ? (
    <Text size={1}>{listFormatter.format([errorText, warningText])}</Text>
  ) : (
    <Text size={1}>{errorText || warningText}</Text>
  )
}

function ValidationErrorIcon() {
  const {t} = useTranslation()
  return (
    <ErrorOutlineIcon
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
      data-testid="input-validation-icon-info"
      aria-label={t('form.validation.has-info-aria-label')}
      aria-hidden
      role="presentation"
    />
  )
}
