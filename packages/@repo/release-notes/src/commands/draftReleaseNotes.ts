/* oxlint-disable no-console */
import {at, patch, SanityEncoder, set, setIfMissing} from '@sanity/mutate'

import {client} from '../client'
import {generateHumanReadableReleaseNotes} from '../utils/generateHumanReadableReleaseNotes'
import {getSanityDocumentIdsForBaseVersion} from '../utils/ids'

export async function draftReleaseNotes(options: {baseVersion: string}) {
  const {changelogDocumentId} = getSanityDocumentIdsForBaseVersion(options.baseVersion)
  const changelogDocument = await client.getDocument(changelogDocumentId.version)
  if (!changelogDocument) {
    throw new Error(`No changelog document found for base version ${options.baseVersion}`)
  }

  const draftContent = await generateHumanReadableReleaseNotes({
    changelogDocument,
  })

  const mutations = [
    patch(changelogDocumentId.version, [
      at('releaseAutomation', setIfMissing({})),
      at('releaseAutomation.suggestedContent', set(draftContent)),
    ]),
  ]

  await client.transaction(SanityEncoder.encodeAll(mutations)).commit()
}
