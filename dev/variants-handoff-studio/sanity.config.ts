import {buildTheme, type ThemeColorTokenValue} from '@sanity/ui/theme'
import {defineConfig, definePlugin} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {NavbarWithVariants} from './c1/NavbarWithVariants'
import {inventoryInspector} from './c4/InventoryInspector'
import {LayoutWithFloatingOptions} from './options/FloatingOptions'
import {schemaTypesFor} from './schemas'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'
// The stand-in preview (dev/preview-iframe, variants-preview.html) mounts @sanity/visual-editing against this dataset. Locally it runs
// on `vite --port 3334`; the hosted Studio uses the same build on Vercel (variants-handoff-preview.sanity.dev, deployed 22 Oct).
// Set SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3456 to use the Northfold storefront instead.
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ||
  (process.env.NODE_ENV === 'production'
    ? 'https://variants-handoff-preview.sanity.dev'
    : 'http://localhost:3334')
const previewPath = previewOrigin.endsWith(':3456') ? '/' : '/variants-preview.html?route=list'

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

// UI5 proposal (Faheem, 26 Oct): the primary buttons are black, not blue, in the Handoff Studio only. Buttons only: selection, links and focus rings
// keep their own tokens and stay blue. Each token is [light, dark]; in dark the button is white with black text. Only the primary tone of the three
// button modes is set; every other tone keeps the Studio's colours.
const BLACK: ThemeColorTokenValue = ['black', 'white']
const WHITE: ThemeColorTokenValue = ['white', 'black']
const primaryButtonTheme = buildTheme({
  color: {
    button: {
      default: {
        primary: {
          enabled: {bg: BLACK, fg: WHITE, border: BLACK, icon: WHITE},
          hovered: {
            bg: ['gray/800', 'gray/200'],
            fg: WHITE,
            border: ['gray/800', 'gray/200'],
            icon: WHITE,
          },
          pressed: {
            bg: ['gray/700', 'gray/300'],
            fg: WHITE,
            border: ['gray/700', 'gray/300'],
            icon: WHITE,
          },
          selected: {
            bg: ['gray/700', 'gray/300'],
            fg: WHITE,
            border: ['gray/700', 'gray/300'],
            icon: WHITE,
          },
          disabled: {
            bg: ['gray/200', 'gray/800'],
            fg: ['gray/500', 'gray/500'],
            border: ['gray/200', 'gray/800'],
            icon: ['gray/500', 'gray/500'],
          },
        },
      },
      ghost: {
        primary: {
          enabled: {
            bg: ['white/0', 'black/0'],
            fg: BLACK,
            border: ['black/0.3', 'white/0.3'],
            icon: BLACK,
          },
          hovered: {
            bg: ['black/0.06', 'white/0.08'],
            fg: BLACK,
            border: ['black/0.3', 'white/0.3'],
            icon: BLACK,
          },
          pressed: {
            bg: ['black/0.1', 'white/0.12'],
            fg: BLACK,
            border: ['black/0.3', 'white/0.3'],
            icon: BLACK,
          },
          selected: {
            bg: ['black/0.1', 'white/0.12'],
            fg: BLACK,
            border: ['black/0.3', 'white/0.3'],
            icon: BLACK,
          },
          disabled: {
            bg: ['white/0', 'black/0'],
            fg: ['gray/400', 'gray/600'],
            border: ['black/0.1', 'white/0.1'],
            icon: ['gray/400', 'gray/600'],
          },
        },
      },
      bleed: {
        primary: {
          enabled: {
            bg: ['white/0', 'black/0'],
            fg: BLACK,
            border: ['white/0', 'black/0'],
            icon: BLACK,
          },
          hovered: {
            bg: ['black/0.06', 'white/0.08'],
            fg: BLACK,
            border: ['white/0', 'black/0'],
            icon: BLACK,
          },
          pressed: {
            bg: ['black/0.1', 'white/0.12'],
            fg: BLACK,
            border: ['white/0', 'black/0'],
            icon: BLACK,
          },
          selected: {
            bg: ['black/0.1', 'white/0.12'],
            fg: BLACK,
            border: ['white/0', 'black/0'],
            icon: BLACK,
          },
          disabled: {
            bg: ['white/0', 'black/0'],
            fg: ['gray/400', 'gray/600'],
            border: ['white/0', 'black/0'],
            icon: ['gray/400', 'gray/600'],
          },
        },
      },
    },
  },
})

export default defineConfig({
  name: 'default',
  title: 'Content Variants Handoff Studio',
  projectId,
  dataset,
  plugins: [
    structureTool({structure}),
    // The tools read Structure, Presentation, Variants, Releases: Presentation comes right after Structure.
    presentationTool({
      allowOrigins: ['http://localhost:*', 'https://*.sanity.dev'],
      previewUrl: {origin: previewOrigin, preview: previewPath},
    }),
    variantsHandoffOptions(),
  ],
  theme: primaryButtonTheme,
  schema: {types: schemaTypesFor(dataset)},
  scheduledDrafts: {enabled: true},
  // The Variants flag is ON: today's open-beta baseline (the shipped Variants tool, variant UI in the Studio). The
  // Variants 2.0 designs extend it through the PROPOSED extension points. "Stock" in the Design options window means
  // this baseline without the designs. (A flag-off baseline, if needed, would be a second workspace.)
  beta: {variants: {enabled: true}},
})
