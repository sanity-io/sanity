import {createPublishedId, getDraftId, getVersionId} from '@sanity/id-utils'

const createId = (releaseId: string, input: string) => {
  const published = createPublishedId(input)
  return {published, version: getVersionId(published, releaseId), draft: getDraftId(published)}
}

export function getSanityDocumentIdsForBaseVersion(baseVersion: string, source: string = 'studio') {
  // the default source is excluded from the key to keep ids stable for documents
  // created before the source discriminator was introduced. A non-default source
  // (e.g. a maintenance branch) gets its own id namespace so it can't collide with
  // a release from main that has the same base version
  const key = source === 'studio' ? baseVersion : `${source}:${baseVersion}`
  const baseVersionId = Buffer.from(key).toString('base64url')

  const releaseId = `rstudio-${baseVersionId}`

  const changelogDocumentId = createId(releaseId, `studio-${baseVersionId}`)
  const apiVersionDocId = createId(releaseId, `${changelogDocumentId.published}-api-version`)

  return {releaseId, changelogDocumentId, apiVersionDocId}
}
