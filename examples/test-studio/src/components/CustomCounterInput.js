import {AddIcon, RemoveIcon} from '@sanity/icons'
import {FormFieldHeaderText} from '@sanity/base/components'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import {FieldPresence} from '@sanity/base/presence'
import {Box, Button, Card, Code, Flex, Inline} from '@sanity/ui'
import React, {forwardRef, useCallback, useImperativeHandle, useRef} from 'react'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'

export const CustomCounterInput = forwardRef((props, ref) => {
  const {onBlur, onChange, onFocus, markers, presence, type, value = 0} = props
  const rootRef = useRef()

  useImperativeHandle(ref, () => ({
    focus: rootRef.current?.focus(),
  }))

  const handleDecr = useCallback(() => {
    onChange(PatchEvent.from(set(value - 1)))
  }, [onChange, value])

  const handleIncr = useCallback(() => {
    onChange(PatchEvent.from(set(value + 1)))
  }, [onChange, value])

  return (
    <ChangeIndicator>
      <Card border onBlur={onBlur} onFocus={onFocus} radius={1} tabIndex={0}>
        <Flex align="center">
          <Box padding={1}>
            <Inline space={1}>
              <Button icon={RemoveIcon} onClick={handleDecr} padding={2} />
              <Card padding={2} radius={2} tone="transparent">
                <Code>{value || 0}</Code>
              </Card>
              <Button icon={AddIcon} onClick={handleIncr} padding={2} />
            </Inline>
          </Box>

          <Box flex={1} padding={3}>
            <FormFieldHeaderText
              __unstable_markers={markers}
              description={type.description}
              title={type.title}
            />
          </Box>

          <Box paddingX={3}>
            <FieldPresence maxAvatars={1} presence={presence} />
          </Box>
        </Flex>
      </Card>
    </ChangeIndicator>
  )
})

CustomCounterInput.displayName = 'CustomCounterInput'
