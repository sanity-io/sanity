import {type ChunkType} from 'sanity'

import {TIMELINE_ICON_COMPONENTS} from './constants'

export function getTimelineEventIcon(type: ChunkType): React.JSX.Element | undefined {
  const IconComponent = TIMELINE_ICON_COMPONENTS[type]
  return IconComponent ? <IconComponent /> : undefined
}
