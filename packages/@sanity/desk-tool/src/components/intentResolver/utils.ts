// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'

export function removeDraftPrefix(documentId: string): string {
  const publishedId = getPublishedId(documentId)

  if (publishedId !== documentId) {
    console.warn(
      'Removed unexpected draft id in document link: All links to documents should have the ' +
        '`drafts.`-prefix removed and something appears to have made an intent link to `%s`',
      documentId
    )
  }

  return publishedId
}
