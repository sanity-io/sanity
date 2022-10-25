import {CalendarIcon} from '@sanity/icons'
import {Box, Flex, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef} from 'react'
import type {FilterInputTypeDateRangeComponentProps} from '../../../config/inputTypes'

export function FieldInputDateRange({filter, onChange}: FilterInputTypeDateRangeComponentProps) {
  const numberMax = useRef<string | null>(filter?.value?.max || null)
  const numberMin = useRef<string | null>(filter?.value?.min || null)

  const handleChange = useCallback(() => {
    onChange({
      max: numberMax?.current,
      min: numberMin?.current,
    })
  }, [onChange])

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      numberMax.current = event.currentTarget.value
      handleChange()
    },
    [handleChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      numberMin.current = event.currentTarget.value
      handleChange()
    },
    [handleChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          icon={CalendarIcon}
          onChange={handleMinChange}
          placeholder="Date 1"
          size={1}
          style={{minWidth: '200px'}}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          icon={CalendarIcon}
          onChange={handleMaxChange}
          placeholder="Date 2"
          size={1}
          style={{minWidth: '200px'}}
        />
      </Box>
    </Flex>
  )
}
