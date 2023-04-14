import React, {useCallback} from 'react'
import {ButtonProps} from '@sanity/ui'
import {PaneMenuItem} from '../../types'
import {StatusButton} from 'sanity'

export interface PaneHeaderActionButtonProps {
  item: PaneMenuItem
  onMenuAction: (item: PaneMenuItem) => void
  padding?: ButtonProps['padding']
}

export function PaneHeaderActionButton(props: PaneHeaderActionButtonProps) {
  const {item, onMenuAction, padding} = props
  const handleClick = useCallback(() => onMenuAction(item), [item, onMenuAction])

  return (
    <StatusButton
      icon={item.icon}
      label={item.title}
      onClick={handleClick}
      padding={padding}
      selected={item.selected}
      tone={item.tone}
    />
  )
}
