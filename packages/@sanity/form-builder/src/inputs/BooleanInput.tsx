import React, {useRef, useCallback} from 'react'
import {Box, Card, Checkbox, Flex, Grid, Switch, Stack, Text} from '@sanity/ui'
import ValidationStatus from 'part:@sanity/components/validation/status'
import FieldStatus from '@sanity/base/lib/__legacy/@sanity/components/fieldsets/FieldStatus'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import {BooleanSchemaType} from '@sanity/types'
import PatchEvent, {set} from '../PatchEvent'
import {Props} from './types'
import {useId} from '@reach/auto-id'

// Todo: display validation and field status
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
        <Grid gap={6}>
          <Card as="label" border radius={1} padding={4}>
            <Flex align="center">
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
              />
              <Box marginLeft={4}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    {type.title}
                  </Text>
                  {type.description && (
                    <Text muted size={1}>
                      {type.description}
                    </Text>
                  )}
                </Stack>
              </Box>
            </Flex>
          </Card>
        </Grid>
      </ChangeIndicator>
    )
  }
)

BooleanInput.displayName = 'BooleanInput'

export default BooleanInput
