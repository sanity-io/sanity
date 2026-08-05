import {type SanityClient} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'

import {withResourceOnProjectHost} from '../../../../../util/withResourceOnProjectHost'

export function getReferenceClient(
  client: SanityClient,
  schemaType: GlobalDocumentReferenceSchemaType,
): SanityClient {
  if (schemaType.resourceType === 'dataset') {
    const [projectId, datasetName] = schemaType.resourceId.split('.', 2)
    return withResourceOnProjectHost(client, {
      apiVersion: 'X',
      resource: {
        type: 'dataset',
        id: `${projectId}.${datasetName}`,
      },
    })
  }
  if (schemaType.resourceType === 'media-library' || schemaType.resourceType === 'canvas') {
    return withResourceOnProjectHost(client, {
      apiVersion: '2025-02-19',
      resource: {
        type: schemaType.resourceType,
        id: schemaType.resourceId,
      },
    })
  }
  throw new Error(`Invalid resource type "${schemaType.resourceType}"`)
}
