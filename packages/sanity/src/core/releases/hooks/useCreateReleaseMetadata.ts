import {useCallback} from 'react'

import useTimeZone, {TimeZoneScopeType} from '../../scheduledPublishing/hooks/useTimeZone'
import {type EditableReleaseDocument} from '../store'

export const useCreateReleaseMetadata = () => {
  const {zoneDateToUtc} = useTimeZone({type: TimeZoneScopeType.contentReleases})

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
