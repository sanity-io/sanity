import {IconComponent} from '@sanity/icons'
import {TIMELINE_ICON_COMPONENTS, TIMELINE_LABELS} from './constants'
import {ChunkType, Chunk} from 'sanity'

export function formatTimelineEventLabel(type: ChunkType): string | undefined {
  return TIMELINE_LABELS[type]
}

export function getTimelineEventIconComponent(type: ChunkType): IconComponent | undefined {
  return TIMELINE_ICON_COMPONENTS[type]
}

export function sinceTimelineProps(
  since: Chunk,
  rev: Chunk
): {
  topSelection: Chunk
  bottomSelection: Chunk
  disabledBeforeSelection: boolean
} {
  return {
    topSelection: rev,
    bottomSelection: since,
    disabledBeforeSelection: true,
  }
}

export function revTimelineProps(rev: Chunk): {
  topSelection: Chunk
  bottomSelection: Chunk
} {
  return {
    topSelection: rev,
    bottomSelection: rev,
  }
}
