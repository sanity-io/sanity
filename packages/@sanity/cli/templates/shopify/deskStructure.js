/**
 * Desk structure overrides
 *
 * This file configure how documents are structured in the Studio's desk tool.
 * It works because
    {
      "name": "part:@sanity/desk-tool/structure",
      "path": "./deskStructure.js"
    },
  * is added to the `parts` array in `/sanity.json`.
  *
  * Sanity Studio automatically lists document types out of the box.
  * With this custom desk structure we achieve things like showing the `home`
  * and `settings` document types as singletons, and grouping product details
  * and variants for easy editorial access.
  *
  * You can customize this even further as your schemas progress.
  * To learn more about structure builder, visit our docs:
  * https://www.sanity.io/docs/overview-structure-builder
 */

import S from '@sanity/desk-tool/structure-builder'
import {articles} from './desk/articles'
import {collections} from './desk/collections'
import {home} from './desk/home'
import {products} from './desk/products'
import {settings} from './desk/settings'

// If you add document types to desk structure manually, you can add them to this array to prevent duplicates in the root pane
const DOCUMENT_TYPES_IN_STRUCTURE = [
  'article.editorial',
  'article.info',
  'collection',
  'home',
  'media.tag',
  'page',
  'product',
  'productVariant',
  'settings',
]

export default () => {
  // prettier-ignore
  return (
    S.list()
      .title('Content')
      .items([
        home,
        articles,
        S.divider(),
        collections,
        products,
        S.divider(),
        settings,
        S.divider(),
        // Automatically add new document types to the root pane
        ...S.documentTypeListItems().filter(listItem => !DOCUMENT_TYPES_IN_STRUCTURE.includes(listItem.getId()))
      ])
  )
}
