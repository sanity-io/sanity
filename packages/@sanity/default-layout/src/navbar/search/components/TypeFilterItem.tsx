import type {SearchableType} from '@sanity/base'
import {CheckmarkIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import {useCommandList} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'

interface TypeFilterItemProps {
  index: number
  selected: boolean
  small?: boolean
  type: SearchableType
}

const TypeFilterItemButton = styled(Button)<{$level: number}>(({$level}) => {
  return css`
    [data-focused='true'][data-level='${$level}'] &,
    [data-hovered='true'][data-level='${$level}'] & {
      &[data-active='true'] {
        background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  `
})

export function TypeFilterItem({index, selected, small, type}: TypeFilterItemProps) {
  const {dispatch} = useSearchState()

  const {level, onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

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
      $level={level}
      aria-selected={selected}
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
