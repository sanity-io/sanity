import {type FormNodeValidation} from '@sanity/types'
import {type Placement} from '@sanity/ui'
import {Text, Box, Flex, VStack, type TextProps, Icon} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useListFormat} from '../../../hooks/useListFormat'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {statusIconWrapper, styledStack} from './FormFieldValidationStatus.css'
import {StatusIcon} from './ValidationStatusIcon'

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
  fontSize?: TextProps['size']
  placement?: Placement
}

const EMPTY_ARRAY: never[] = []

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {validation = EMPTY_ARRAY, __unstable_showSummary: showSummary, fontSize, placement} = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info'

  return (
    <Tooltip
      content={
        <VStack className={styledStack} gap={3}>
          {showSummary && <FormFieldValidationSummary validation={validation} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                // oxlint-disable-next-line no-array-index-key
                <FormFieldValidationStatusItem key={itemIndex} validation={item} />
              ))}
            </>
          )}
        </VStack>
      }
      portal
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <div className={statusIconWrapper}>
        <Icon size={fontSize} icon={<StatusIcon status={status} />} />
      </div>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {validation: FormNodeValidation}) {
  const {validation} = props

  return (
    <Flex>
      <Box marginRight={2}>
        <Icon
          size={1}
          icon={<StatusIcon status={validation.level} />}
          style={{margin: '-0.375rem'}}
        />
      </Box>
      <Box flexBasis="0%" flexGrow={1}>
        <Text size={1} as="div" trim={true}>
          {validation.message}
        </Text>
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
    <Text size={1} as="div" trim={true}>
      {listFormatter.format([errorText, warningText])}
    </Text>
  ) : (
    <Text size={1} as="div" trim={true}>
      {errorText || warningText}
    </Text>
  )
}
