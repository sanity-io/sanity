import {type DocumentActionProps, type DocumentActionDescription, type SanityDocument} from 'sanity'

export type ShopifyDocument = SanityDocument & {
  store: {
    id: number
    productId: number
    isDeleted: boolean
  }
}

export interface ShopifyDocumentActionProps extends DocumentActionProps {
  published: ShopifyDocument
  draft: ShopifyDocument
}
