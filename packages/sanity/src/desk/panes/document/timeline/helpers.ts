import {IconComponent} from '@sanity/icons'
import {TIMELINE_ICON_COMPONENTS, TIMELINE_LABELS} from './constants'
import {ChunkType} from 'sanity'

export function formatTimelineEventLabel(type: ChunkType): string | undefined {
  return TIMELINE_LABELS[type]
}

export function getTimelineEventIconComponent(type: ChunkType): IconComponent | undefined {
  return TIMELINE_ICON_COMPONENTS[type]
}
