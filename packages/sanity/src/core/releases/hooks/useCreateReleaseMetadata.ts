import {type EditableReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import useTimeZone from '../../scheduledPublishing/hooks/useTimeZone'

export const useCreateReleaseMetadata = () => {
  const {zoneDateToUtc} = useTimeZone()

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
