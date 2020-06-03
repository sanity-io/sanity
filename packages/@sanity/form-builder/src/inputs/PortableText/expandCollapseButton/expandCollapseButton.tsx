import FullscreenExitIcon from 'part:@sanity/base/fullscreen-exit-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import Button from 'part:@sanity/components/buttons/default'
import React from 'react'
import {IS_MAC} from '../PortableTextInput'

interface Props {
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

export function ExpandCollapseButton(props: Props) {
  const {isFullscreen, onToggleFullscreen} = props

  return (
    <Button
      icon={isFullscreen ? FullscreenExitIcon : FullscreenIcon}
      kind="simple"
      onClick={onToggleFullscreen}
      padding="small"
      title={`Open in fullscreen (${IS_MAC ? 'cmd' : 'ctrl'}+enter)`}
    />
  )
}
