import {createPublishedId, getDraftId, getVersionId} from '@sanity/id-utils'

export const createId = (releaseId: string, input: string) => {
  const published = createPublishedId(input)
  return {published, version: getVersionId(published, releaseId), draft: getDraftId(published)}
}
