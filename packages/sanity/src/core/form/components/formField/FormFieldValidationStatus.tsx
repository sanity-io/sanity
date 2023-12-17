import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import type {FormNodeValidation} from '@sanity/types'
import {Box, Flex, Placement, Stack, Text} from '@sanity/ui'
import styled from 'styled-components'
import {useTranslation} from '../../../i18n'
import {useListFormat} from '../../../hooks'
import {Tooltip} from '../../../ui-components'

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
  fontSize?: number | number
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
    return {'--card-icon-color': 'var(--card-badge-critical-icon-color)'}
  }

  if ($status === 'warning') {
    return {'--card-icon-color': 'var(--card-badge-caution-icon-color)'}
  }

  if ($status === 'info') {
    return {'--card-icon-color': 'var(--card-badge-primary-icon-color)'}
  }

  return {}
})

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {validation = EMPTY_ARRAY, __unstable_showSummary: showSummary, fontSize, placement} = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')
  // const hasInfo = validation.some((v) => v.level === 'info')

  // eslint-disable-next-line no-nested-ternary
  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info'
  const StatusIcon = VALIDATION_ICONS[status]

  return (
    <Tooltip
      content={
        <StyledStack space={3}>
          {showSummary && <FormFieldValidationSummary validation={validation} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <FormFieldValidationStatusItem validation={item} key={itemIndex} />
              ))}
            </>
          )}
        </StyledStack>
      }
      portal
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <div>
        <StatusText $status={status} size={fontSize} weight="medium">
          {StatusIcon && <StatusIcon />}
        </StatusText>
      </div>
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
