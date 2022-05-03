import {Button, Card} from '@sanity/ui'
import React, {useCallback} from 'react'
import {ArrayOfObjectsInputProps, RenderItemCallback} from '../types'
import {ArrayInput} from '../inputs/arrays/ArrayOfObjectsInput'
import {ItemOfObject} from '../types/itemProps'

export interface StudioArrayInputProps extends ArrayOfObjectsInputProps {}

export function StudioArrayInput(props: StudioArrayInputProps) {
  const renderItem: RenderItemCallback = useCallback((_item) => {
    const item = _item as ItemOfObject
    return (
      <Card radius={2} padding={2}>
        <Button
          onClick={() => item.onSetCollapsed(!item.collapsed)}
          text={item.collapsed ? 'Expand' : 'Collapse'}
        />
        {item.collapsed ? JSON.stringify(item.value) : <div>Edit!</div>}
      </Card>
    )
  }, [])
  return <ArrayInput {...props} renderItem={renderItem} />
}
