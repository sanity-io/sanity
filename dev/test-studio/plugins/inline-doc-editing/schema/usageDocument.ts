import {BookIcon} from '@sanity/icons'

export const assetUsageDocumentBaseDefinition = {
  name: 'sanity.asset-library.usage-document',
  title: 'Asset Library Usage Document',
  type: 'document',
  fields: [
    // TODO: make this an Asset Library Asset type
    {
      name: 'asset',
      title: 'Asset Library Asset',
      description: 'Global document reference to asset in the asset library',
      type: 'globalDocumentReference',
      resourceType: 'dataset',
      resourceId: 'exx11uqh.blog',
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              media: 'coverImage',
            },
            prepare(val: {title: string; coverImage: string}) {
              return {
                title: val.title,
                media: val.coverImage,
              }
            },
          },
        },
      ],
    },
  ],
}
