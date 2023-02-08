import {
  definePlugin,
  DocumentActionComponent,
  DocumentActionsResolver,
  NewDocumentOptionsResolver,
} from 'sanity'
import shopifyDelete from './shopifyDelete'
import shopifyLink from './shopifyLink'

import {SHOPIFY_DOCUMENT_TYPES} from '../../constants'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (SHOPIFY_DOCUMENT_TYPES.includes(schemaType)) {
    prev = prev.filter(
      (previousAction: DocumentActionComponent) =>
        previousAction.action === 'publish' ||
        previousAction.action === 'unpublish' ||
        previousAction.action === 'discardChanges'
    )

    return [
      ...prev,
      shopifyDelete as DocumentActionComponent,
      shopifyLink as DocumentActionComponent,
    ]
  }

  return prev
}

export const resolveNewDocumentOptions: NewDocumentOptionsResolver = (prev) => {
  const options = prev.filter((previousOption) => {
    return !SHOPIFY_DOCUMENT_TYPES.includes(previousOption.templateId)
  })

  return options
}

export const shopifyDocumentActions = definePlugin({
  name: 'custom-document-actions',
  document: {
    actions: resolveDocumentActions,
    newDocumentOptions: resolveNewDocumentOptions,
  },
})
