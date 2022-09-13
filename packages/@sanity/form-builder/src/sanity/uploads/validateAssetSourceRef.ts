import {
  AssetFromSource,
  AssetSchemaTypeOptions,
  FileSchemaType,
  ImageSchemaType,
  SanityDocument,
  SchemaType,
} from '@sanity/types'
import accept from 'attr-accept'
import type {SanityAssetDocument, SanityClient} from '@sanity/client'
import sanityClient from 'part:@sanity/base/client'
import * as is from '../../utils/is'
import uploaders from './uploaders'
import {FileLike, Uploader} from './types'

const versionedClient = sanityClient.withConfig({
  apiVersion: '1',
}) as SanityClient

type AssetFieldSchemaType = Omit<any, 'options'> & {
  options?: Pick<AssetSchemaTypeOptions, 'accept'>
}

export default async function validateAssetSourceRef(
  type: AssetFieldSchemaType,
  asset: AssetFromSource
): Promise<boolean> {
  try {
    const doc: SanityAssetDocument = await versionedClient.getDocument(asset.value as string)
    const accepts = accept(
      {name: doc.originalFilename, type: doc.mimeType},
      (type.options as any)?.accept || ''
    )

    if (
      !doc?.mimeType ||
      !accept({name: doc.originalFilename, type: doc.mimeType}, (type.options as any)?.accept || '')
    ) {
      throw new Error('Invalid file type selected')
    }

    return true
  } catch (e) {
    console.log(e)

    throw e
  }

  return false
}
