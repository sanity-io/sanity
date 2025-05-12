import {type SanityClient} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'

export function getReferenceClient(
  client: SanityClient,
  schemaType: GlobalDocumentReferenceSchemaType,
): SanityClient {
  if (schemaType.resourceType === 'dataset') {
    const [projectId, datasetName] = schemaType.resourceId.split('.', 2)
    return client.withConfig({
      'apiVersion': 'X',
      '~experimental_resource': {
        type: 'dataset',
        id: `${projectId}.${datasetName}`,
      },
    })
  }
  if (schemaType.resourceType === 'media-library' || schemaType.resourceType === 'canvas') {
    return client.withConfig({
      'apiVersion': '2025-02-19',
      '~experimental_resource': {
        type: schemaType.resourceType,
        id: schemaType.resourceId,
      },
    })
  }
  throw new Error(`Invalid resource type "${schemaType.resourceType}"`)
}
