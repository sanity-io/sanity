import {Button, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {FilterInputTypeAssetComponentProps} from '../../../config/inputTypes'

export function FieldInputAsset({filter, onChange}: FilterInputTypeAssetComponentProps) {
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
