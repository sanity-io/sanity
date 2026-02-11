import {type FormNodeValidation} from '@sanity/types'
import {Box, Flex, type Placement, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useListFormat} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {StatusIcon} from './ValidationStatusIcon'

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
  fontSize?: number
  placement?: Placement
}

const EMPTY_ARRAY: never[] = []

const StyledStack = styled(Stack)`
  max-width: 200px;
`

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {validation = EMPTY_ARRAY, __unstable_showSummary: showSummary, fontSize, placement} = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info'

  return (
    <Tooltip
      content={
        <StyledStack space={3}>
          {showSummary && <FormFieldValidationSummary validation={validation} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                // oxlint-disable-next-line no-array-index-key
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
        <Text size={fontSize} weight="medium">
          <StatusIcon status={status} />
        </Text>
      </StatusIconWrapper>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {validation: FormNodeValidation}) {
  const {validation} = props

  return (
    <Flex>
      <Box marginRight={2}>
        <Text size={1} weight="medium">
          <StatusIcon status={validation.level} />
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
