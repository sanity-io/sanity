import {Box, Card, type CardTone, Checkbox, Flex, Switch} from '@sanity/ui'
import styled from 'styled-components'

import {FormFieldHeaderText} from '../components/formField/FormFieldHeaderText'
import {FormFieldStatus} from '../components/formField/FormFieldStatus'
import {type BooleanInputProps} from '../types'

const Root = styled(Card)`
  line-height: 1;
`

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

/**
 *
 * @hidden
 * @beta
 */
export function BooleanInput(props: BooleanInputProps) {
  const {id, value, schemaType, readOnly, elementProps, validation} = props
  const layout = schemaType.options?.layout || 'switch'

  const indeterminate = typeof value !== 'boolean'
  const checked = value || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const tone: CardTone | undefined = readOnly ? 'transparent' : undefined

  return (
    <Root border data-testid="boolean-input" radius={2} tone={tone}>
      <Flex>
        <ZeroLineHeightBox padding={3}>
          <LayoutSpecificInput
            label={schemaType.title}
            {...elementProps}
            checked={checked}
            disabled={readOnly}
            indeterminate={indeterminate}
            style={{margin: -4}}
          />
        </ZeroLineHeightBox>
        <Box flex={1} paddingY={2}>
          <FormFieldHeaderText
            deprecated={schemaType.deprecated}
            description={schemaType.description}
            inputId={id}
            validation={validation}
            title={schemaType.title}
          />
        </Box>
        <CenterAlignedBox paddingX={3} paddingY={1}>
          <FormFieldStatus maxAvatars={1} position="top">
            {/*<FieldPresence maxAvatars={1} presence={presence} />*/}
          </FormFieldStatus>
        </CenterAlignedBox>
      </Flex>
    </Root>
  )
}
