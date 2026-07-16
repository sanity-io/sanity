import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {definePlugin} from 'sanity'

import {CoffeeShopDemoTool} from './CoffeeShopDemoTool'

/**
 * Variants coffee shop demo: a minimal "frontend" rendered as a studio tool (no Presentation needed).
 * Shows a product list + detail page fetching published content, with the studio's variant picker
 * sending the returning-visitors variant with the query — demoing personalization via product
 * discounts and automatic variant resolution of referenced documents. Schema types live in
 * `schema/variantsDemo`.
 */
export const variantsCoffeeDemoTool = definePlugin({
  name: 'variants-coffee-demo',
  tools: [
    {
      name: 'coffee-shop-demo',
      title: 'Coffee Shop Demo',
      icon: EarthGlobeIcon,
      component: CoffeeShopDemoTool,
    },
  ],
})
