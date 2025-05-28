import {type EditableReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'

export const useCreateReleaseMetadata = () => {
  const timeZoneScope = {type: 'contentReleases'} as const
  const {zoneDateToUtc} = useTimeZone(timeZoneScope)

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
