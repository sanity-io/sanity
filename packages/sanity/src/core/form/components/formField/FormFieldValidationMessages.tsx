import {type FormNodeValidation} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {memo} from 'react'
import {styled} from 'styled-components'

import {StatusIcon} from './ValidationStatusIcon'

/**
 * Display mode for validation messages:
 * - 'icon': Shows icon + text (icon colored, text neutral)
 * - 'text': Shows only text with color matching validation level
 *
 * @internal
 */
const VALIDATION_MESSAGE_DISPLAY_MODE: 'icon' | 'text' = 'text'

const ErrorText = styled(Text)`
  color: var(--card-badge-critical-fg-color);
`

const WarningText = styled(Text)`
  color: var(--card-badge-caution-fg-color);
`

const InfoText = styled(Text)`
  color: var(--card-badge-primary-fg-color);
`

/** @internal */
export interface FormFieldValidationMessagesProps {
  validation: FormNodeValidation[]
}

/** @internal */
export const FormFieldValidationMessages = memo(function FormFieldValidationMessages(
  props: FormFieldValidationMessagesProps,
) {
  const {validation} = props

  if (validation.length === 0) {
    return null
  }

  return (
    <Stack space={2} paddingY={1}>
      {validation.map((item) => (
        <ValidationMessage key={`${pathToString(item.path)}-${item.level}`} validation={item} />
      ))}
    </Stack>
  )
})

function ValidationMessage(props: {validation: FormNodeValidation}) {
  const {validation} = props

  if (VALIDATION_MESSAGE_DISPLAY_MODE === 'text') {
    return <ValidationMessageText validation={validation} />
  }

  return <ValidationMessageWithIcon validation={validation} />
}

function ValidationMessageWithIcon(props: {validation: FormNodeValidation}) {
  const {validation} = props

  return (
    <Flex align="flex-start" gap={2} paddingX={1}>
      <Box>
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

function ValidationMessageText(props: {validation: FormNodeValidation}) {
  const {validation} = props

  const TextComponent =
    validation.level === 'error'
      ? ErrorText
      : validation.level === 'warning'
        ? WarningText
        : InfoText

  return <TextComponent size={1}>{validation.message}</TextComponent>
}
