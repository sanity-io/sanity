import {type IconComponent} from '@sanity/icons'
import {type ChunkType} from 'sanity'

import {TIMELINE_ICON_COMPONENTS} from './constants'

export function getTimelineEventIconComponent(type: ChunkType): IconComponent | undefined {
  return TIMELINE_ICON_COMPONENTS[type]
}
