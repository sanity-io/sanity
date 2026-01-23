import {CloseIcon} from '@sanity/icons'
import {type DeprecatedProperty, type FormNodeValidation} from '@sanity/types'
import {Badge, Box, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {memo, type ReactNode} from 'react'
import {styled} from 'styled-components'

import {TextWithTone} from '../../../components'
import {useTranslation} from '../../../i18n'
import {createDescriptionId} from '../../members/common/createDescriptionId'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'

const LabelSuffix = styled(Flex)`
  /*
   * Prevent the block size of appended elements (such as the deprecated field badge) affecting
   * the intrinsic block size of the label, while still allowing the inline size (width) to
   * expand naturally to fit its content.
   */
  height: 0;
  overflow: visible;
`

/** @internal */
export interface FormFieldHeaderTextProps {
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  description?: ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: ReactNode
  deprecated?: DeprecatedProperty
  /**
   * Additional content to be rendered alongside the title
   */
  suffix?: ReactNode
  /**
   * Whether this field is temporarily revealed (hidden field shown due to validation navigation)
   * @internal
   */
  isRevealed?: boolean
  /**
   * Callback to hide the revealed field again
   * @internal
   */
  onHideRevealed?: () => void
}

const EMPTY_ARRAY: never[] = []

/** @internal */
export const FormFieldHeaderText = memo(function FormFieldHeaderText(
  props: FormFieldHeaderTextProps,
) {
  const {
    description,
    inputId,
    title,
    deprecated,
    validation = EMPTY_ARRAY,
    suffix,
    isRevealed,
    onHideRevealed,
  } = props
  const {t} = useTranslation()
  const hasValidations = validation.length > 0

  return (
    <Stack space={3}>
      <Flex align="center" paddingY={1}>
        <Flex align="center">
          <Text as="label" htmlFor={inputId} weight="medium" size={1}>
            {title || (
              <span style={{color: 'var(--card-muted-fg-color)'}}>
                {t('form.field.untitled-field-label')}
              </span>
            )}
          </Text>
        </Flex>

        {suffix && (
          <Box marginLeft={2} data-testid="form-field-suffix">
            {suffix}
          </Box>
        )}

        {(deprecated || hasValidations || isRevealed) && (
          <LabelSuffix align="center">
            {isRevealed && (
              <Box marginLeft={2}>
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text size={1}>
                        {t('form.field.revealed-tooltip', {
                          defaultValue:
                            'This field is normally hidden but is shown because of a validation error',
                        })}
                      </Text>
                    </Box>
                  }
                  placement="top"
                  portal
                >
                  <Badge
                    data-testid={`revealed-badge-${title}`}
                    tone="caution"
                    onClick={onHideRevealed}
                    style={onHideRevealed ? {cursor: 'pointer'} : undefined}
                  >
                    <Flex align="center" gap={1}>
                      {t('form.field.revealed-label', {defaultValue: 'Hidden'})}
                      {onHideRevealed && <CloseIcon style={{fontSize: '0.75em'}} />}
                    </Flex>
                  </Badge>
                </Tooltip>
              </Box>
            )}

            {deprecated && (
              <Box marginLeft={2}>
                <Badge data-testid={`deprecated-badge-${title}`} tone="caution">
                  {t('form.field.deprecated-label')}
                </Badge>
              </Box>
            )}

            {hasValidations && (
              <Box marginLeft={2}>
                <FormFieldValidationStatus
                  data-testid={`input-validation-icon-error`}
                  fontSize={1}
                  placement="top"
                  validation={validation}
                />
              </Box>
            )}
          </LabelSuffix>
        )}
      </Flex>

      {deprecated && (
        <TextWithTone data-testid={`deprecated-message-${title}`} tone="caution" size={1}>
          {deprecated.reason}
        </TextWithTone>
      )}

      {description && (
        <Text muted size={1} id={createDescriptionId(inputId, description)}>
          {description}
        </Text>
      )}
    </Stack>
  )
})
