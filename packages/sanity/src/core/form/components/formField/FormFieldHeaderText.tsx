import {type DeprecatedProperty, type FormNodeValidation} from '@sanity/types'
import {Badge, Box, Flex, Stack, Text} from '@sanity/ui'
import {memo, type ReactNode} from 'react'
import {styled} from 'styled-components'

import {TextWithTone} from '../../../components'
import {useTranslation} from '../../../i18n'
import {createDescriptionId} from '../../members/common/createDescriptionId'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'

const LabelSuffix = styled(Flex)`
  /*
   * Prevent the block size of appended elements (such as the deprecated field badge) affecting
   * the intrinsic block size of the label.
   */
  contain: size;
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
}

const EMPTY_ARRAY: never[] = []

/** @internal */
export const FormFieldHeaderText = memo(function FormFieldHeaderText(
  props: FormFieldHeaderTextProps,
) {
  const {description, inputId, title, deprecated, validation = EMPTY_ARRAY} = props
  const {t} = useTranslation()
  const hasValidations = validation.length > 0
  const hasLabelSuffix = deprecated || hasValidations

  return (
    <Stack space={3}>
      <Flex align="center" paddingY={1}>
        <Text as="label" htmlFor={inputId} weight="medium" size={1}>
          {title || (
            <span style={{color: 'var(--card-muted-fg-color)'}}>
              {t('form.field.untitled-field-label')}
            </span>
          )}
        </Text>

        {hasLabelSuffix && (
          <LabelSuffix align="center" flex={1}>
            {deprecated && (
              <Box marginLeft={2}>
                <Badge data-testid={`deprecated-badge-${title}`} tone="caution">
                  {t('form.field.deprecated-label')}
                </Badge>
              </Box>
            )}

            {hasValidations && (
              <Box marginLeft={2}>
                <FormFieldValidationStatus fontSize={1} placement="top" validation={validation} />
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
