import {defineConfig, definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'

import {NavbarWithVariants} from './c1/NavbarWithVariants'
import {inventoryInspector} from './c4/InventoryInspector'
import {LayoutWithFloatingOptions} from './options/FloatingOptions'
import {schemaTypesFor} from './schemas'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'
const variantsHandoffOptions = definePlugin({
  name: 'variants-handoff-studio',
  // The stock Studio's document actions and inspectors stay as they ship; the Versions inspector is the one addition (C4 option D).
  document: {
    inspectors: (prev) => [...prev, inventoryInspector],
  },
  studio: {
    components: {
      layout: LayoutWithFloatingOptions,
      navbar: NavbarWithVariants,
    },
  },
})

export default defineConfig({
  name: 'default',
  title: 'Content Variants Handoff Studio',
  projectId,
  dataset,
  plugins: [structureTool({structure}), variantsHandoffOptions()],
  schema: {types: schemaTypesFor(dataset)},
  scheduledDrafts: {enabled: true},
  // The Variants flag is ON: today's open-beta baseline (the shipped Variants tool, variant UI in the Studio). The
  // Variants 2.0 designs extend it through the PROPOSED extension points. "Stock" in the Design options window means
  // this baseline without the designs. (A flag-off baseline, if needed, would be a second workspace.)
  beta: {variants: {enabled: true}},
})
