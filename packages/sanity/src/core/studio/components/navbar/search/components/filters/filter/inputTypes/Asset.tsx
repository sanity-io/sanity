import {Button, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputAsset({onChange}: OperatorInputComponentProps<string>) {
  const handleChange = useCallback((event: ChangeEvent<HTMLElement>) => {
    // onChange(event.currentTarget.value)
  }, [])

  return (
    <Stack space={2}>
      <Button text="Select asset" />
    </Stack>
  )
}
