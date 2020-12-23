import {CollapseIcon, ExpandIcon} from '@sanity/icons'
import React from 'react'
import {Button} from '@sanity/ui'

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
      mode="bleed"
      onClick={onToggleFullscreen}
      padding={2}
      title={`Open in fullscreen (${IS_MAC ? 'cmd' : 'ctrl'}+enter)`}
    />
  )
}
