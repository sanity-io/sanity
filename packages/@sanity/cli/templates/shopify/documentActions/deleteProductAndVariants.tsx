/**
 * Custom document action
 *
 * Learn more: https://www.sanity.io/docs/document-actions
 */
import {useRouter} from '@sanity/base/router'
import {TrashIcon} from '@sanity/icons'
import {Stack, Text, useToast} from '@sanity/ui'
import sanityClient from 'part:@sanity/base/client'
import React, {useState} from 'react'
import {SANITY_API_VERSION} from '../constants'

type Props = {
  draft?: Record<string, any> // Sanity Document
  onComplete: () => void
  published?: Record<string, any> // Sanity Document
  type: string
}

const DeleteProductAndVariants = (props: Props) => {
  const {draft, onComplete, published} = props

  const [dialogOpen, setDialogOpen] = useState(false)

  const router = useRouter()
  const toast = useToast()

  return {
    color: 'danger',
    dialog: dialogOpen && {
      header: 'Delete current product and associated variants?',
      message: (
        <Stack space={4}>
          <Text>
            Delete the current product and all associated variants in your Sanity Content Lake.
          </Text>
          <Text weight="medium">No content on Shopify will be deleted.</Text>
        </Stack>
      ),
      onCancel: onComplete,
      onConfirm: async () => {
        const productId = published?.store?.id

        // Find product variant documents with matching Shopify Product ID
        let productVariantIds: string[] = []
        if (productId) {
          productVariantIds = await sanityClient.withConfig({apiVersion: SANITY_API_VERSION}).fetch(
            `*[
                _type == "productVariant"
                && store.productId == $productId
              ]._id`,
            {productId: productId}
          )
        }

        // Delete current document (including draft)
        const transaction = sanityClient.transaction()
        if (published?._id) {
          transaction.delete(published._id)
        }
        if (draft?._id) {
          transaction.delete(draft._id)
        }

        // Delete all product variants with matching IDs
        productVariantIds?.forEach((documentId) => {
          if (documentId) {
            transaction.delete(documentId)
            transaction.delete(`drafts.${documentId}`)
          }
        })

        try {
          await transaction.commit()
          // Navigate back to products root
          router.navigateUrl('/desk/products')
        } catch (err) {
          toast.push({
            status: 'error',
            title: err?.message,
          })
        } finally {
          // Signal that the action is complete
          onComplete()
        }
      },
      type: 'confirm',
    },
    icon: TrashIcon,
    label: 'Delete',
    onHandle: () => setDialogOpen(true),
    shortcut: 'Ctrl+Alt+D',
  }
}

export default DeleteProductAndVariants
