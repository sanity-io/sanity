import {type EditableReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../studio/constants'

export const useCreateReleaseMetadata = () => {
  const {zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  const createReleaseMetadata = useCallback(
    (release: EditableReleaseDocument) => {
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
