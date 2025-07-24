// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import 'player.style/sutro'

import MuxPlayer from '@mux/mux-player-react'

type VideoPlayerProps = {
  playbackId: string
  aspectRatio?: number
  muted?: boolean
  disabled?: boolean
}

export function VideoPlayer({playbackId, ..._props}: VideoPlayerProps) {
  return (
    <MuxPlayer
      theme={'sutro' as const}
      playbackId={playbackId}
      autoPlay={false}
      loop={false}
      style={{
        position: 'absolute',
        inset: 0,
      }}
    />
  )
}
