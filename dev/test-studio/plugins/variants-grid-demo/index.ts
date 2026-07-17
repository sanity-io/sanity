import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {VariantsGridTool} from './VariantsGridTool'

/**
 * Variants grid demo: a studio tool that lays a document group out on a grid — variants as
 * columns (default first), bundles as rows (published, drafts, then releases stacked like the
 * releases perspective picker). The studio navbar's perspective and variant pickers drive a
 * hand-rolled Content Lake query (`perspective` + `variant` request parameters), highlighting the document the API
 * returns — demonstrating that resolution happens server-side.
 */
export const variantsGridDemoTool = definePlugin({
  name: 'variants-grid-demo',
  tools: [
    {
      name: 'variants-grid',
      title: 'Variants Grid',
      icon: ThLargeIcon,
      component: VariantsGridTool,
      router: route.create('/', [route.create('/:docId')]),
    },
  ],
})
