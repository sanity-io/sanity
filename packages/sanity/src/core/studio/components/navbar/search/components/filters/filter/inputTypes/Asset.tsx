import {Button, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {OperatorInputComponentProps} from '../../../../definitions/operators'

export function FieldInputAsset({onChange}: OperatorInputComponentProps<any>) {
  const handleChange = useCallback((event: ChangeEvent<HTMLElement>) => {
    // onChange(event.currentTarget.value)
  }, [])

  return (
    <Stack space={2}>
      <Button text="Select asset" />
    </Stack>
  )
}
