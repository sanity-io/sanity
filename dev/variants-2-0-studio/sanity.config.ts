import {buildTheme, type ThemeColorTokenValue} from '@sanity/ui/theme'
import {defineConfig, definePlugin} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {NavbarWithVariants} from './c1/NavbarWithVariants'
import {AddVariantAction} from './c4/AddVariantAction'
import {inventoryInspector} from './c4/InventoryInspector'
import {asVariantNewDocumentOptions, asVariantTemplates} from './c13/NewDocumentAsVariant'
import {baseNameBundles} from './c15/baseName'
import {E9Block, E9Field, E9Input, E9Item} from './fieldmarks/E9Marks'
import {fieldLevel, localization} from './localization/plugin'
import {structure} from './localization/structure'
import {LayoutWithFloatingOptions} from './options/FloatingOptions'
import {namingTarget} from './pane/targetLabel'
import {ReviewSwitch, rememberStock} from './review/E9Review'
import {schemaTypesFor} from './schemas'
import {designSlotsTool, inventoryTool, ToolMenuWithSlots} from './slots/DesignSlotsTool'
import {presentationGridTool} from './spike/PresentationGrid'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'
// The Northfold storefront (repos/northfold-storefront, `pnpm dev`) is the default preview.
// The stand-in preview (dev/preview-iframe, `vite --port 3334`, variants-preview.html) mounts @sanity/visual-editing against
// this dataset. Set SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3456 to use the Northfold storefront instead.
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3334'
const previewPath = previewOrigin.endsWith(':3334') ? '/variants-preview.html?route=list' : '/'

const variants2Options = definePlugin({
  name: 'variants-2-0-options',
  // C15: core's base-document strings, as the chosen option names it (read at load).
  i18n: {bundles: baseNameBundles},
  // SPIKE: SANITY_STUDIO_GRID=1 adds the separate "Presentation grid" tool (not part of the designs).
  tools: [
    inventoryTool,
    designSlotsTool,
    ...(process.env.SANITY_STUDIO_GRID ? [presentationGridTool] : []),
  ],
  // The stock Review changes inspector keeps its place; its body is the E9 panel while `reviewPanel` is B or C (A renders the stock one).
  document: {
    // Open beta header (B5): the primary action names its target ("Publish France"). C13 B: Add variant right after Publish, the first action
    // (27 Oct, Faheem, as in the Handoff Studio); it draws nothing with C13 A.
    actions: (prev) => {
      const named = prev.map((action) =>
        action.action === 'publish' ? namingTarget(action) : action,
      )
      return [...named.slice(0, 1), AddVariantAction, ...named.slice(1)]
    },
    // C13 B: the list panes' "+" offer "<Type> as a variant…" (c13/NewDocumentAsVariant.tsx).
    newDocumentOptions: asVariantNewDocumentOptions,
    inspectors: (prev) => [
      ...prev.map((inspector) => {
        if (inspector.name !== 'sanity/structure/history') return inspector
        rememberStock(inspector.component)
        return {...inspector, component: ReviewSwitch}
      }),
      inventoryInspector,
    ],
  },
  // C13 B: "<Type> as a variant…" in the create menus. The templates are always there; the layout's source wrapper shows them only with C13 B.
  schema: {templates: asVariantTemplates},
  // Field marks through the public form.components overrides: the C9 candidates (switch c9) and the E9 marks (switch fieldMarks).
  // Each wrapper renders the shipped form unchanged while its switch is A.
  form: {components: {block: E9Block, field: E9Field, input: E9Input, item: E9Item}},
  studio: {
    components: {
      layout: LayoutWithFloatingOptions,
      navbar: NavbarWithVariants,
      toolMenu: ToolMenuWithSlots,
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
  theme: primaryButtonTheme,
  title: 'Variants 2.0 · design studio',
  projectId,
  dataset,
  plugins: [
    structureTool({structure}),
    presentationTool({
      allowOrigins: ['http://localhost:*', 'https://*.sanity.dev'],
      previewUrl: {origin: previewOrigin, preview: previewPath},
    }),
    variants2Options(),
    localization(),
    fieldLevel,
  ],
  schema: {types: schemaTypesFor(dataset)},
  scheduledDrafts: {enabled: true},
  // The Variants flag is ON: today's open-beta baseline (the shipped Variants tool, variant UI in the Studio). The
  // Variants 2.0 designs extend it through the PROPOSED extension points. "Stock" in the Design options window means
  // this baseline without the designs. (A flag-off baseline, if needed, would be a second workspace.)
  beta: {variants: {enabled: true}},
})
