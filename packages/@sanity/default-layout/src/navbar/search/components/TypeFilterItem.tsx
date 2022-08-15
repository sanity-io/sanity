import {CheckmarkIcon} from '@sanity/icons'
import type {ObjectSchemaType} from '@sanity/types'
import {Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useCommandList} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {withCommandListItemStyles} from '../utils/withCommandListItemStyles'

const CommandListItemButton = withCommandListItemStyles(Button)

interface TypeFilterItemProps {
  index: number
  selected: boolean
  small?: boolean
  type: ObjectSchemaType
}

export function TypeFilterItem({index, selected, small, type}: TypeFilterItemProps) {
  const {dispatch} = useSearchState()

  const {onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

  const handleTypeAdd = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: type})
  }, [dispatch, type])

  const handleTypeRemove = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: type})
  }, [dispatch, type])

  const handleClick = useCallback(() => {
    onChildClick?.()
    if (selected) {
      handleTypeRemove()
    } else {
      handleTypeAdd()
    }
  }, [handleTypeAdd, handleTypeRemove, onChildClick, selected])

  return (
    <CommandListItemButton
      aria-checked={selected}
      data-index={index}
      fontSize={small ? 1 : 2}
      iconRight={selected && CheckmarkIcon}
      justify="flex-start"
      key={type.title ?? type.name}
      mode="bleed"
      onClick={handleClick}
      onMouseDown={onChildMouseDown}
      onMouseEnter={onChildMouseEnter(index)}
      selected={selected}
      text={type.title ?? type.name}
      tone={selected ? 'primary' : 'default'}
    />
  )
}
