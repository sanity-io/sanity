import {Button, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'

export function FieldInputAsset({filter, onChange}: any) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLElement>) => {
      // onChange(event.currentTarget.value)
    },
    [onChange]
  )

  return (
    <Stack space={2}>
      <Button text="Select asset" />
    </Stack>
  )
}
