import React, {useCallback} from 'react'
import {Box, Card, Checkbox, Flex, Switch} from '@sanity/ui'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import {BooleanSchemaType} from '@sanity/types'
import {useId} from '@reach/auto-id'
import FieldStatus from '@sanity/base/lib/__legacy/@sanity/components/fieldsets/FieldStatus'
import {FieldPresence} from '@sanity/base/presence'
import PatchEvent, {set} from '../PatchEvent'
import {FormFieldHeaderText} from '../components/FormField/FormFieldHeaderText'
import {Props} from './types'

const BooleanInput = React.forwardRef(
  (props: Props<boolean, BooleanSchemaType>, ref: React.ForwardedRef<HTMLInputElement>) => {
    const {onChange} = props
    const {value, type, readOnly, onFocus, markers, presence} = props
    const layout = type.options?.layout || 'switch'
    const inputId = useId()

    const handleChange = useCallback(
      (event: React.SyntheticEvent<HTMLInputElement>) => {
        onChange(PatchEvent.from(set(event.currentTarget.checked)))
      },
      [onChange]
    )

    const indeterminate = typeof value !== 'boolean'
    const checked = value || false

    const Input = layout === 'checkbox' ? Checkbox : Switch

    return (
      <ChangeIndicator>
        <Card as="label" border radius={1} padding={3}>
          <Flex>
            <Box style={{lineHeight: 0}}>
              <Input
                id={inputId}
                ref={ref}
                label={type.title}
                readOnly={Boolean(readOnly)}
                onChange={handleChange}
                onFocus={onFocus}
                indeterminate={indeterminate}
                checked={checked}
                content={type.description}
                style={{margin: -4}}
              />
            </Box>
            <Box marginLeft={3} flex={1}>
              <FormFieldHeaderText
                description={type.description}
                markers={markers}
                title={type.title}
              />
            </Box>
            <Box>
              <FieldStatus maxAvatars={1} position="top">
                <FieldPresence maxAvatars={1} presence={presence} />
              </FieldStatus>
            </Box>
          </Flex>
        </Card>
      </ChangeIndicator>
    )
  }
)

BooleanInput.displayName = 'BooleanInput'

export default BooleanInput
