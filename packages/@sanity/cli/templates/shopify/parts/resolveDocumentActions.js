// Default document actions
import defaultResolve, {
  CreateAction,
  DeleteAction,
  DuplicateAction,
  UnpublishAction,
} from 'part:@sanity/base/document-actions'
import {LOCKED_DOCUMENT_IDS, LOCKED_DOCUMENT_TYPES} from '../constants'
import deleteProductAndVariants from '../documentActions/deleteProductAndVariants'
import shopifyLink from '../documentActions/shopifyLink'

export default function resolveDocumentActions(props) {
  return [
    // Start with Sanity's default actions
    ...defaultResolve(props)
      // Filter out actions by document type
      .filter((action) => {
        // Prevent creation & deletion on certain document types
        if (LOCKED_DOCUMENT_TYPES.includes(props.type)) {
          if ([DeleteAction, DuplicateAction, UnpublishAction].includes(action)) {
            return false
          }
        }

        // Prevent creation & deletion on certain document ids (singletons)
        if (LOCKED_DOCUMENT_IDS.includes(props.id)) {
          if ([DeleteAction, DuplicateAction, UnpublishAction].includes(action)) {
            return false
          }
        }

        // Products:
        // - Disable creation and duplication
        if (props.type === 'product') {
          if ([CreateAction, DuplicateAction].includes(action)) {
            return false
          }
        }

        // Product variants:
        // - Disable creation, duplication and unpublishing
        // - Enable delete button only if variant has been marked for deletion
        if (props.type === 'productVariant') {
          if ([CreateAction, DuplicateAction, UnpublishAction].includes(action)) {
            return false
          }

          if (action === DeleteAction) {
            if (props?.published?.store?.isDeleted) {
              return true
            }
            return false
          }
        }

        return true
      })
      // Override any built-in actions with our own
      .map((action) => {
        // Products: replace default delete action
        if (props.type === 'product' && action === DeleteAction) {
          return deleteProductAndVariants
        }

        return action
      }),
    // Add our own custom actions
    shopifyLink,
  ]
}
