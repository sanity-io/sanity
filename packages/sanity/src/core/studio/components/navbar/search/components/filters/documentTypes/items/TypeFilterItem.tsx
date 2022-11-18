import {CheckmarkIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import type {SearchableType} from '../../../../../../../../search'
import {useCommandList} from '../../../../contexts/commandList'
import {useSearchState} from '../../../../contexts/search/useSearchState'

interface TypeFilterItemProps {
  index: number
  selected: boolean
  type: SearchableType
}

const TypeFilterItemButton = styled(Button)`
  white-space: normal;
  width: 100%;
  [data-active='true'] & {
    // TODO: investigate issue where this background isn't respected after switching studio theme _multiple_ times (at least twice)
    background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
    // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
    box-shadow: none;
  }
`

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

  return (
    <TypeFilterItemButton
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
  )
})
