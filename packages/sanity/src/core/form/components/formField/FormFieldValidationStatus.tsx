import React from 'react'
import {hues} from '@sanity/color'
import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import type {FormNodeValidation} from '@sanity/types'
import {Box, Flex, Placement, Stack, Text, Tooltip} from '@sanity/ui'
import styled from 'styled-components'
import {useTranslation} from '../../../i18n'
import {useListFormat} from '../../../hooks'

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

const VALIDATION_STYLES: Record<'error' | 'warning' | 'info', {color: string}> = {
  error: {color: hues.red[500].hex},
  warning: {color: hues.yellow[500].hex},
  info: {color: hues.blue[500].hex},
}

const VALIDATION_ICONS = {
  error: ValidationErrorIcon,
  warning: ValidationWarningIcon,
  info: ValidationInfoIcon,
}

const StyledStack = styled(Stack)`
  max-width: 200px;
`

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {
    validation = EMPTY_ARRAY,
    __unstable_showSummary: showSummary,
    fontSize,
    placement = 'top',
  } = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')
  const hasInfo = validation.some((v) => v.level === 'info')

  const StatusIcon = (() => {
    if (hasErrors) return VALIDATION_ICONS.error
    if (hasWarnings) return VALIDATION_ICONS.warning
    if (hasInfo) return VALIDATION_ICONS.info
    return undefined
  })()

  const statusStyle = (() => {
    if (hasErrors) return VALIDATION_STYLES.error
    if (hasWarnings) return VALIDATION_STYLES.warning
    if (hasInfo) return VALIDATION_STYLES.info
    return undefined
  })()

  return (
    <Tooltip
      content={
        <StyledStack padding={3} space={3}>
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
        <Text muted size={fontSize} weight="semibold" style={statusStyle}>
          {StatusIcon && <StatusIcon />}
        </Text>
      </div>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {validation: FormNodeValidation}) {
  const {validation} = props

  const StatusIcon = (() => {
    if (validation.level === 'error') return VALIDATION_ICONS.error
    if (validation.level === 'warning') return VALIDATION_ICONS.warning
    if (validation.level === 'info') return VALIDATION_ICONS.info
    return undefined
  })()

  const statusStyle = (() => {
    if (validation.level === 'error') return VALIDATION_STYLES.error
    if (validation.level === 'warning') return VALIDATION_STYLES.warning
    if (validation.level === 'info') return VALIDATION_STYLES.info
    return undefined
  })()

  return (
    <Flex>
      <Box marginRight={2}>
        <Text size={1} style={statusStyle}>
          {StatusIcon && <StatusIcon />}
        </Text>
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
