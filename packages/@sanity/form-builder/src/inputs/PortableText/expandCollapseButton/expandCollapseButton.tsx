import {CollapseIcon, ExpandIcon} from '@sanity/icons'
import Button from 'part:@sanity/components/buttons/default'
import React from 'react'

const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

interface Props {
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

export function ExpandCollapseButton(props: Props) {
  const {isFullscreen, onToggleFullscreen} = props

  return (
    <Button
      icon={isFullscreen ? CollapseIcon : ExpandIcon}
      kind="simple"
      onClick={onToggleFullscreen}
      padding="small"
      title={`Open in fullscreen (${IS_MAC ? 'cmd' : 'ctrl'}+enter)`}
    />
  )
}
