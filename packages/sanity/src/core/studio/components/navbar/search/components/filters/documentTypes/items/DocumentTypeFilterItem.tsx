import {CheckmarkIcon} from '@sanity/icons'
import {Box, Button, ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {useCallback} from 'react'
import type {SearchableType} from '../../../../../../../../search'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {CommandListItem} from '../../../commandList/CommandListItem.styled'
import {useCommandList} from '../../../commandList/useCommandList'

interface DocumentTypeFilterItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  index: number | null
  selected: boolean
  type: SearchableType
}

export const DocumentTypeFilterItem = React.memo(function TypeFilterItem({
  index,
  selected,
  type,
  ...rest
}: DocumentTypeFilterItemProps) {
  const {dispatch} = useSearchState()

  const {onChildMouseEnter, onChildMouseDown} = useCommandList()

  const handleTypeAdd = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: type})
  }, [dispatch, type])

  const handleTypeRemove = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: type})
  }, [dispatch, type])

  const handleClick = useCallback(() => {
    if (selected) {
      handleTypeRemove()
    } else {
      handleTypeAdd()
    }
  }, [handleTypeAdd, handleTypeRemove, selected])

  if (index === null) {
    return null
  }

  return (
    <Box {...rest}>
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
