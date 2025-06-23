// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unassigned-import
import 'player.style/sutro'

import MuxPlayer from '@mux/mux-player-react'

type VideoPlayerProps = {
  playbackId: string
  aspectRatio?: number
  muted?: boolean
  disabled?: boolean
}

export function VideoPlayer({playbackId, aspectRatio, muted, disabled}: VideoPlayerProps) {
  const isPortrait = aspectRatio && aspectRatio < 1
  const wrapperWidth = isPortrait ? undefined : 'auto'
  const wrapperHeight = isPortrait ? '100%' : undefined

  return (
    <MuxPlayer
      theme={'sutro' as const}
      playbackId={playbackId}
      autoPlay={false}
      loop={false}
      style={{
        width: wrapperWidth,
        height: wrapperHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio,
      }}
    />
  )
}
