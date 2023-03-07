import {structureClient} from '../parts/Client'

export async function resolveTypeForDocument(id: string): Promise<string | undefined> {
  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = id.replace(/^drafts\./, '')
  const draftId = `drafts.${documentId}`

  const types = await structureClient.fetch(
    query,
    {documentId, draftId},
    {tag: 'structure.resolve-type'}
  )

  return types[0]
}
