import {IconComponent} from '@sanity/icons'
import {TIMELINE_ICON_COMPONENTS} from './constants'
import {ChunkType} from 'sanity'

export function getTimelineEventIconComponent(type: ChunkType): IconComponent | undefined {
  return TIMELINE_ICON_COMPONENTS[type]
}
