import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../studio/constants'
import {type EditableStudioReleaseDocument} from '../types'

export const useCreateReleaseMetadata = () => {
  const {zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  const createReleaseMetadata = useCallback(
    (release: EditableStudioReleaseDocument) => {
      const {metadata} = release
      const intendedPublishAt = metadata.intendedPublishAt
        ? zoneDateToUtc(new Date(metadata.intendedPublishAt)).toISOString()
        : undefined

      return {
        ...release,
        metadata: {
          ...metadata,
          intendedPublishAt,
          title: metadata?.title?.trim(),
        },
      }
    },
    [zoneDateToUtc],
  )

  return createReleaseMetadata
}
