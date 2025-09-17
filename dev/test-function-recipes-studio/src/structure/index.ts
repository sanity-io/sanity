import {CogIcon, TagIcon, PackageIcon, IceCreamIcon, CopyIcon} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import pluralize from 'pluralize-esm'

/**
 * Structure builder is useful whenever you want to control how documents are grouped and
 * listed in the studio or for adding additional in-studio previews or content to documents.
 * Learn more: https://www.sanity.io/docs/structure-builder-introduction
 */

const DISABLED_TYPES = ['settings', 'assist.instruction.context']
const COMMERCE_TYPES = ['product', 'productVariant', 'collection', 'colorTheme']

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Website Content')
    .items([
      // Regular content types (excluding commerce types)
      ...S.documentTypeListItems()
        .filter(
          (listItem: any) =>
            !DISABLED_TYPES.includes(listItem.getId()) &&
            !COMMERCE_TYPES.includes(listItem.getId()),
        )
        .map((listItem) => {
          return listItem.title(pluralize(listItem.getTitle() as string))
        }),

      // Commerce section with dividers
      S.divider().title('Commerce'),
      S.documentTypeListItem('product').title('Products').icon(TagIcon),
      S.documentTypeListItem('productVariant').title('Product Variants').icon(CopyIcon),
      S.documentTypeListItem('collection').title('Collections').icon(PackageIcon),
      S.documentTypeListItem('colorTheme').title('Color Themes').icon(IceCreamIcon),
      S.divider(),

      // Settings
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('settings').documentId('siteSettings'))
        .icon(CogIcon),
    ])
