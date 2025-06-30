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
  const wrapperWidth = isPortrait ? 'auto' : '100%'
  const wrapperHeight = isPortrait ? '100%' : undefined
  const maxWidth = isPortrait ? 'fit-content' : '100%'
  const maxHeight = isPortrait ? '100%' : 'fit-content'

  return (
    <MuxPlayer
      theme={'sutro' as const}
      playbackId={playbackId}
      autoPlay={false}
      loop={false}
      style={{
        width: wrapperWidth,
        height: wrapperHeight,
        maxWidth,
        maxHeight,
        aspectRatio,
      }}
    />
  )
}
