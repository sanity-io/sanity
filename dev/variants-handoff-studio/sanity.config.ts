import {buildTheme, type ThemeColorTokenValue} from '@sanity/ui/theme'
import {defineConfig, definePlugin, type WorkspaceOptions} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

// Review build only: the UI 5 selected blue from #16035 applied to this studio's own theme (#16035 changes Studio's
// default theme, which a custom theme like this one doesn't use). Not part of any PR.
import {applyUi5SelectedColors} from '../../packages/sanity/src/core/theme/ui5SelectedColors'
// OPEN-BETA PREVIEW (11 Nov): this copy runs on the open-beta preview branch (main + today's PRs), not on the Handoff branch. The Handoff-only
// layers are switched off so the Studio shows what main + the PRs ship: the layout (options/FloatingOptions.tsx) and the navbar
// (c1/NavbarWithVariants.tsx) need core seams this code does not have (DocumentPaneExtensionProvider, VariantBannerReplacedProvider,
// PerspectiveMenuExtensionProvider, NavbarNeutralProvider, ShippedPerspectiveBarProvider, VariantFilterAddControlProvider, and the
// 'topbar-before-perspective' navbar slot). The Add variant action and the Versions inspector (C4) do run on this code but are the Handoff's own
// prototype UI, so they are off by default: set SANITY_STUDIO_HANDOFF_EXTRAS=1 to add them back. Datasets, schema and structure are unchanged.
import {AddVariantAction} from './c4/AddVariantAction'
import {inventoryInspector} from './c4/InventoryInspector'
import {schemaTypesFor} from './schemas'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
// Studio v7 UX Review reads a copy of variants-2-0 with every variant version removed (v7-ux-review).
const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  (process.env.SANITY_STUDIO_REVIEW_KIND === 'v7' ? 'v7-ux-review' : 'variants-2-0')
// The stand-in preview (dev/preview-iframe, variants-preview.html) mounts @sanity/visual-editing against this dataset. Locally it runs
// on `vite --port 3334`; the hosted Studio uses the same build on Vercel (variants-handoff-preview.sanity.dev, deployed 22 Oct).
// Set SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3456 to use the Northfold storefront instead.
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ||
  (process.env.NODE_ENV === 'production'
    ? 'https://variants-handoff-preview.sanity.dev'
    : 'http://localhost:3334')
const previewPath = previewOrigin.endsWith(':3456') ? '/' : '/variants-preview.html?route=list'

const handoffExtras = process.env.SANITY_STUDIO_HANDOFF_EXTRAS === '1'

const variantsHandoffOptions = definePlugin({
  name: 'variants-handoff-studio',
  // On the Handoff branch: the Versions inspector (C4 option D), and Add variant in the action menu right after Publish (27 Oct, Faheem).
  // Off by default on the open-beta preview (see the note at the top).
  document: handoffExtras
    ? {
        actions: (prev) => [...prev.slice(0, 1), AddVariantAction, ...prev.slice(1)],
        inspectors: (prev) => [...prev, inventoryInspector],
      }
    : {},
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
          // Hover is a clearly lighter step than rest (26 Oct: it was near invisible); pressed and selected go one step further.
          hovered: {
            bg: ['gray/600', 'gray/400'],
            fg: WHITE,
            border: ['gray/600', 'gray/400'],
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

// Two review studios share this config, the integration build and the dataset:
// - Open Beta Review Studio (default): what open beta customers see, with Variants on.
// - Studio v7 UX Review (SANITY_STUDIO_REVIEW_KIND=v7): what every Studio with Releases gets, with Variants
//   off and the document inventory on through its own switch.
const isV7UxReview = process.env.SANITY_STUDIO_REVIEW_KIND === 'v7'

// One workspace's settings: which dataset it reads and which of Variants, Releases and drafts are on.
function reviewWorkspace(options: {
  name: string
  title: string
  basePath?: string
  dataset: string
  variants: boolean
  releases: boolean
  drafts: boolean
}): WorkspaceOptions {
  return {
    name: options.name,
    title: options.title,
    basePath: options.basePath ?? '/',
    projectId,
    dataset: options.dataset,
    plugins: [
      structureTool({structure}),
      // The tools read Structure, Presentation, Variants, Releases: Presentation comes right after Structure.
      presentationTool({
        allowOrigins: ['http://localhost:*', 'https://*.sanity.dev'],
        previewUrl: {origin: previewOrigin, preview: previewPath},
      }),
      variantsHandoffOptions(),
    ],
    theme: applyUi5SelectedColors(primaryButtonTheme),
    schema: {types: schemaTypesFor(options.dataset)},
    scheduledDrafts: {enabled: true},
    ...(options.releases ? {} : {releases: {enabled: false}}),
    ...(options.drafts ? {} : {document: {drafts: {enabled: false}}}),
    // With Variants off, the document inventory is on through its own switch (what every Studio with Releases gets).
    beta: options.variants
      ? {variants: {enabled: true}}
      : {variants: {enabled: false}, documentGroupInventory: {enabled: true}},
  }
}

// Workspaces with Variants off read the dataset without variant versions (v7-ux-review): in variants-2-0 those versions
// show up as stray marks when Variants is off.
const DATASET_WITH_VARIANTS = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'
const DATASET_WITHOUT_VARIANTS = process.env.SANITY_STUDIO_DATASET || 'v7-ux-review'
// The drafts-off workspace writes to its own copy of variants-2-0 (19 Nov): its Publish draft and Discard draft buttons would
// otherwise change the documents the open beta test cases use.
const DATASET_DRAFTS_OFF = process.env.SANITY_STUDIO_DATASET || 'drafts-off-review'

// Open Beta Review Studio (19 Nov, Jordan's ask): the open beta workspace first, then the switch combinations to compare
// against it. The first workspace is where the studio address lands.
const openBetaWorkspaces = [
  reviewWorkspace({
    name: 'default',
    title: 'Open beta (Variants and Releases on)',
    basePath: '/open-beta',
    dataset: DATASET_WITH_VARIANTS,
    variants: true,
    releases: true,
    drafts: true,
  }),
  reviewWorkspace({
    name: 'variants-off-releases-off',
    title: 'Variants and Releases off',
    basePath: '/variants-off-releases-off',
    dataset: DATASET_WITHOUT_VARIANTS,
    variants: false,
    releases: false,
    drafts: true,
  }),
  reviewWorkspace({
    name: 'variants-only',
    title: 'Only Variants (Releases off)',
    basePath: '/variants-only',
    dataset: DATASET_WITH_VARIANTS,
    variants: true,
    releases: false,
    drafts: true,
  }),
  reviewWorkspace({
    name: 'releases-only',
    title: 'Only Releases (Variants off)',
    basePath: '/releases-only',
    dataset: DATASET_WITHOUT_VARIANTS,
    variants: false,
    releases: true,
    drafts: true,
  }),
  // 25 Nov (Faheem): Variants off over the data that has variants, as in a studio that turns Variants off after making
  // some. Case 10.2 needs it: the published document stays blocked from deletion while its hidden variants exist. A
  // workspace of its own, so the Releases-only cases keep their data without variant versions.
  reviewWorkspace({
    name: 'variants-turned-off',
    title: 'Variants turned off (data has variants)',
    basePath: '/variants-turned-off',
    dataset: DATASET_WITH_VARIANTS,
    variants: false,
    releases: true,
    drafts: true,
  }),
  reviewWorkspace({
    name: 'drafts-off',
    title: 'Variants and Releases on, drafts off',
    basePath: '/drafts-off',
    dataset: DATASET_DRAFTS_OFF,
    variants: true,
    releases: true,
    drafts: false,
  }),
]

export default defineConfig(
  isV7UxReview
    ? reviewWorkspace({
        name: 'default',
        title: 'Studio v7 UX Review',
        dataset,
        variants: false,
        releases: true,
        drafts: true,
      })
    : openBetaWorkspaces,
)
