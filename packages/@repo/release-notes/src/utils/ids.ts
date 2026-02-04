import {createPublishedId, getDraftId, getVersionId} from '@sanity/id-utils'

export const createId = (releaseId: string, input: string) => {
  const published = createPublishedId(input)
  return {published, version: getVersionId(published, releaseId), draft: getDraftId(published)}
}

export function getSanityDocumentIdsForBaseVersion(baseVersion: string) {
  const baseVersionId = Buffer.from(baseVersion).toString('base64url')

  const releaseId = `rstudio-${baseVersionId}`

  const changelogDocumentId = createId(releaseId, `studio-${baseVersionId}`)
  const apiVersionDocId = createId(releaseId, `${changelogDocumentId.published}-api-version`)

  return {releaseId, changelogDocumentId, apiVersionDocId}
}
