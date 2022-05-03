import {Card} from '@sanity/ui'
import React, {useCallback} from 'react'
import {ArrayOfObjectsInputProps, RenderItemCallback} from '../types'
import {ArrayInput} from '../inputs/arrays/ArrayOfObjectsInput'

export interface StudioArrayInputProps extends ArrayOfObjectsInputProps {}

export function StudioArrayInput(props: StudioArrayInputProps) {
  const renderItem: RenderItemCallback = useCallback((item) => {
    return (
      <Card radius={2} padding={2}>
        {item.children}
      </Card>
    )
  }, [])
  return <ArrayInput {...props} renderItem={renderItem} />
}
