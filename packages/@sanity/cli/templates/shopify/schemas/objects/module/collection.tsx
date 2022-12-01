import {PackageIcon} from '@sanity/icons'
import React from 'react'
import {defineField} from 'sanity'
import ShopifyDocumentStatus from '../../../components/media/ShopifyDocumentStatus'

export default defineField({
  name: 'module.collection',
  title: 'Collection',
  type: 'object',
  icon: PackageIcon,
  fields: [
    // Collection
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      weak: true,
      to: [{type: 'collection'}],
      validation: (Rule) => Rule.required(),
    }),
    // Show background
    defineField({
      name: 'showBackground',
      title: 'Show background',
      type: 'boolean',
      description: 'Use Shopify collection image as background (if available)',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      collectionTitle: 'collection.store.title',
      imageUrl: 'collection.store.imageUrl',
      isDeleted: 'collection.store.isDeleted',
    },
    prepare(selection) {
      const {collectionTitle, imageUrl, isDeleted} = selection
      return {
        media: (
          <ShopifyDocumentStatus
            isDeleted={isDeleted}
            type="collection"
            url={imageUrl}
            title={collectionTitle}
          />
        ),
        subtitle: 'Collection',
        title: collectionTitle,
      }
    },
  },
})
