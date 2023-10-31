import {SanityClient, SanityDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'

export class _TestSanityContext {
  documentIds: Set<string>

  constructor() {
    this.documentIds = new Set<string>()
  }

  getUniqueDocumentId(): string {
    const documentId = uuid()
    this.documentIds.add(documentId)
    return documentId
  }

  addId(id: string): void {
    this.documentIds.add(id)
  }

  teardown(sanityClient: SanityClient): Promise<SanityDocument<Record<string, any>>> {
    return sanityClient.delete({
      query: '*[_id in $ids]',
      params: {ids: [...this.documentIds].map((id) => `drafts.${id}`)},
    })
  }
}
