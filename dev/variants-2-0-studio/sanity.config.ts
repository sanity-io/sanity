import {defineConfig, definePlugin} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {NavbarWithVariants} from './c1/NavbarWithVariants'
import {inventoryInspector} from './c4/InventoryInspector'
import {LayoutWithFloatingOptions} from './options/FloatingOptions'
import {schemaTypesFor} from './schemas'
import {designSlotsTool, inventoryTool, ToolMenuWithSlots} from './slots/DesignSlotsTool'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'
// The Northfold storefront (repos/northfold-storefront, `pnpm dev`) is the default preview.
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3456'

const variants2Options = definePlugin({
  name: 'variants-2-0-options',
  tools: [inventoryTool, designSlotsTool],
  document: {inspectors: (prev) => [...prev, inventoryInspector]},
  studio: {components: {layout: LayoutWithFloatingOptions, navbar: NavbarWithVariants, toolMenu: ToolMenuWithSlots}},
})

export default defineConfig({
  name: 'default',
  title: 'Variants 2.0 · design studio',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    presentationTool({
      allowOrigins: ['http://localhost:*', 'https://*.sanity.dev'],
      previewUrl: {origin: previewOrigin, preview: '/'},
    }),
    variants2Options(),
  ],
  schema: {types: schemaTypesFor(dataset)},
  scheduledDrafts: {enabled: true},
  // The Variants flag is ON: today's open-beta baseline (the shipped Variants tool, variant UI in the Studio). The
  // Variants 2.0 designs extend it through the PROPOSED extension points. "Stock" in the Design options window means
  // this baseline without the designs. (A flag-off baseline, if needed, would be a second workspace.)
  beta: {variants: {enabled: true}},
})
