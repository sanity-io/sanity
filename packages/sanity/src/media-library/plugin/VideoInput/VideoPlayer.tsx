// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import 'player.style/sutro'

import MuxPlayer from '@mux/mux-player-react'

import {type VideoPlaybackTokens} from './types'

type VideoPlayerProps = {
  playbackId: string
  aspectRatio?: number
  tokens?: VideoPlaybackTokens
}

export function VideoPlayer({playbackId, tokens, aspectRatio}: VideoPlayerProps) {
  return (
    <MuxPlayer
      theme={'sutro' as const}
      playbackId={playbackId}
      tokens={tokens}
      autoPlay={false}
      loop={false}
      style={{
        position: 'absolute',
        inset: 0,
        aspectRatio,
      }}
    />
  )
}
