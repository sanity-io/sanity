import {Box, Card, type CardTone, Checkbox, Flex, Switch} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {FormFieldBaseHeader} from '../components/formField/FormFieldBaseHeader'
import {FormFieldHeaderText} from '../components/formField/FormFieldHeaderText'
import {FormFieldStatus} from '../components/formField/FormFieldStatus'
import {useFieldActions} from '../field/actions/useFieldActions'
import type {BooleanInputProps} from '../types/inputProps'

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

/**
 *
 * @hidden
 * @beta
 */
export function BooleanInput(props: BooleanInputProps) {
  const {t} = useTranslation()
  const {
    focused,
    __internal_comments: comments,
    hovered,
    onMouseEnter,
    onMouseLeave,
    actions,
    __internal_slot: slot,
  } = useFieldActions()
  const {id, value, schemaType, readOnly, elementProps, validation, presence} = props
  const layout = schemaType.options?.layout || 'switch'

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const tone: CardTone | undefined = readOnly ? 'transparent' : undefined

  const input = (
    <Box padding={3} style={{paddingTop: '0.85rem'}}>
      <LayoutSpecificInput
        label={schemaType.title}
        {...elementProps}
        checked={checked}
        readOnly={readOnly}
        indeterminate={indeterminate}
        style={{margin: -4}}
      />
    </Box>
  )

  return (
    <Card border data-testid="boolean-input" radius={2} tone={tone}>
      <Flex>
        {readOnly ? <Tooltip content={t('inputs.boolean.disabled')}>{input}</Tooltip> : input}
        <Box flex={1} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} paddingY={2}>
          <FormFieldBaseHeader
            __internal_comments={comments}
            __internal_slot={slot}
            actions={actions}
            fieldFocused={Boolean(focused)}
            fieldHovered={hovered}
            presence={presence}
            inputId={id}
            content={
              <FormFieldHeaderText
                deprecated={schemaType.deprecated}
                description={schemaType.description}
                inputId={id}
                validation={validation}
                title={schemaType.title}
              />
            }
          />
        </Box>
        <CenterAlignedBox paddingX={3} paddingY={1}>
          <FormFieldStatus maxAvatars={1} position="top">
            {/*<FieldPresence maxAvatars={1} presence={presence} />*/}
          </FormFieldStatus>
        </CenterAlignedBox>
      </Flex>
    </Card>
  )
}
