import {CheckmarkIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import type {SearchableType} from '../../../../../../../../search'
import {useCommandList} from '../../../../contexts/commandList'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {CommandListItem} from '../../../common/CommandListItem.styled'

interface TypeFilterItemProps {
  index: number | null
  selected: boolean
  type: SearchableType
}

export const TypeFilterItem = React.memo(function TypeFilterItem({
  index,
  selected,
  type,
}: TypeFilterItemProps) {
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

  if (index === null) {
    return null
  }

  return (
    <Box paddingX={1} paddingTop={1}>
      <Button
        as={CommandListItem}
        data-command-list-item
        fontSize={1}
        iconRight={selected && CheckmarkIcon}
        justify="flex-start"
        key={type.title ?? type.name}
        mode="bleed"
        onClick={handleClick}
        onMouseDown={onChildMouseDown}
        onMouseEnter={onChildMouseEnter(index)}
        selected={selected}
        tabIndex={-1}
        text={type.title ?? type.name}
        tone={selected ? 'primary' : 'default'}
      />
    </Box>
  )
})
