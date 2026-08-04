import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type PropsWithChildren, useCallback, useState} from 'react'
import {route, RouterProvider, type Router} from 'sanity/router'

import {type NavbarProps} from '../../../../packages/sanity/src/core/config/studio/types'
import {type Tool} from '../../../../packages/sanity/src/core/config/types'
import {createRouter} from '../../../../packages/sanity/src/core/studio/router/router'
import {CreateVariantDialog} from '../../../../packages/sanity/src/core/variants/components/dialog/CreateVariantDialog'
import {VariantsStudioNavbar} from '../../../../packages/sanity/src/core/variants/plugin/components/VariantsStudioNavbar'
import {VariantsTool} from '../../../../packages/sanity/src/core/variants/tool/VariantsTool'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'
import {
  createVariantsFixtureClient,
  createVariantsPreviewStore,
  fixtureVariantDocumentCounts,
  fixtureVariantDocuments,
  fixtureVariantMembership,
  fixtureVariants,
} from '../../lib/variantsFixtures'

const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
      {name: 'year', title: 'Year', type: 'number'},
    ],
    preview: {select: {title: 'title', subtitle: 'year'}},
  },
]

const studioConfig = {
  schema: {name: 'mock', types: schemaTypes},
  // The flag under story: OFF by default in every studio. Storybook mounts the
  // gated components directly, but the variants STORE also gates on this
  // workspace flag (`useVariantsStore` → `enabled`), so it must be on for the
  // real store to fetch at all.
  beta: {variants: {enabled: true}},
}

const variantsClient = createVariantsFixtureClient({
  variants: fixtureVariants,
  counts: fixtureVariantDocumentCounts,
  documents: fixtureVariantDocuments,
})

const emptyVariantsClient = createVariantsFixtureClient({variants: [], counts: {}})

const previewStore = createVariantsPreviewStore({
  documents: fixtureVariantDocuments,
  membership: fixtureVariantMembership,
})

// The variants plugin's own tool router (`plugin/index.tsx`), plus an intents
// route: the detail table's document previews render `IntentLink`s, which throw
// on a router without one. Mounted STATEFULLY (structureHarness idiom): row
// links, the create-dialog redirect and the Back button really navigate.
const variantsToolRouter = route.create('/', [
  route.intents('/intent'),
  route.create('/:variantId'),
])

// The navbar row lives OUTSIDE any tool, on the studio root router — built
// with the REAL `createRouter` so tool-scoped state resolves: `ReleasesNav`
// renders a `ToolLink` whose state is `{tool: 'releases', releases: undefined}`,
// which only maps on a router with a scoped route for that tool name.
const navbarRouter = createRouter({
  tools: [
    {
      name: 'releases',
      title: 'Releases',
      component: () => null,
      router: route.create('/'),
    } as unknown as Tool,
  ],
})

function StoryRouter(
  props: PropsWithChildren<{router: Router; initialState?: Record<string, unknown>}>,
) {
  const {router, initialState, children} = props
  const [routerState, setRouterState] = useState<Record<string, unknown>>(initialState ?? {})
  const handleNavigate = useCallback(
    (opts: {path: string}) => setRouterState(router.decode(opts.path) ?? {}),
    [router],
  )
  return (
    <RouterProvider router={router} state={routerState} onNavigate={handleNavigate}>
      {children}
    </RouterProvider>
  )
}

/** Sized frame: the tool lays out with `height="fill"` and needs a bounded parent. */
function ToolFrame({children}: PropsWithChildren) {
  return <div style={{height: 560, display: 'flex', flexDirection: 'column'}}>{children}</div>
}

const meta: Meta = {
  title: 'Versioning/Variants',
  decorators: [
    WithStudioProviders({
      config: studioConfig,
      client: variantsClient,
      previewStore,
      releases: fixtureReleases,
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'One document, many audiences: Content Variants let a single piece carry ' +
            'per-audience, per-market, or per-locale copies, each targeted by conditions and ' +
            "shown to the right reader automatically. This is Sanity's headline bet on " +
            'personalised content, and its value is still under-told.',
          '',
          '|          |                                                                                                                                                                                                                                                            |',
          '| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/variants/`, Studio-only (no design-system equivalent)                                                                                                                                                                            |',
          '| Flag     | `beta.variants.enabled`, default off (`BetaFeatures.variants`, `core/config/types.ts`). When enabled, the plugin registers the Variants tool, the navbar "View as" row, and variant-scoped document handling                                               |',
          '| Tier     | SERVICE. A net-new content primitive composed from existing machinery (releases table, perspective router, preview store); not editing-core, not chrome                                                                                                    |',
          '| Audit    | 🔴 needs-work (`content-versioning`). The benchmark flagged Studio versioning surfaces as under-explained; Variants is the headline default-disabled bet and its in-product value narrative is still thin, these stories double as the missing walkthrough |',
          '| Patterns | `content-versioning`                                                                                                                                                                                                                                       |',
          '',
          'The idea is simple to say and deep to build: write once, define who each variant is ' +
            'for, and let the perspective router serve the matching copy.',
          '',
          'Content Variants let one document group carry per-audience/per-locale variant ' +
            'copies, targeted by `conditions` (audience, market, locale, plan, and so on) with a ' +
            '`priority` order. A variant _definition_ is a `system.variant` document at ' +
            '`_.variants.<id>`; the _content_ lives in ordinary version documents whose ' +
            '`_system.variant` points back at the definition. The surfaces here run the real ' +
            'store, hooks and table code against a fixture client (list and counts queries) and a ' +
            'fixture preview store (membership id-set); see `lib/variantsFixtures.ts`.',
          '',
          'The `Overview` and `Detail` stories mount the whole `VariantsTool` on a stateful ' +
            'router: clicking a variant row opens the real detail view (grouped document table, ' +
            'release bundle chips resolved from the seeded releases store, live validation on the ' +
            'title-less fixture document).',
          '',
          '> **Why it matters:** keep the two halves straight. A variant definition is a ' +
            'system.variant document that describes an audience; the variant content lives in ' +
            'ordinary version documents that point back at that definition. The definition is the ' +
            'rule, the version is the copy, conflate them and the model stops making sense.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:content-versioning',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
    'flag:beta.variants.enabled',
  ],
}

export default meta
type Story = StoryObj

/**
 * The Variants tool at its root: definition list with live document counts
 * (aggregate count query), condition summaries, pin buttons and search. The
 * `enterprise` row shows the missing-`metadata.title` fallback (raw id).
 * Rows are real links, clicking one navigates to the detail view.
 */
export const Overview: Story = {
  render: () => (
    <ToolFrame>
      <StoryRouter router={variantsToolRouter}>
        <VariantsTool />
      </StoryRouter>
    </ToolFrame>
  ),
}

/**
 * The detail view for the "Summer sale" variant, reached via router state
 * exactly as the tool routes it (`/:variantId`). The document table groups
 * version documents by document group: the Solaris guide row carries TWO
 * bundle chips (its copy exists in both the seeded "Hotfix launch" and
 * "Spring campaign" releases), and the title-less atlas fixture surfaces a
 * real required-field validation error badge.
 */
export const Detail: Story = {
  render: () => (
    <ToolFrame>
      <StoryRouter router={variantsToolRouter} initialState={{variantId: 'summer-sale'}}>
        <VariantsTool />
      </StoryRouter>
    </ToolFrame>
  ),
}

/**
 * The overview with zero variant definitions: the real empty state
 * (illustration, explainer copy, create + documentation actions) rendered by
 * the real overview against a store that loaded an empty list.
 */
export const OverviewEmpty: Story = {
  decorators: [
    WithStudioProviders({
      config: studioConfig,
      client: emptyVariantsClient,
      previewStore,
      releases: fixtureReleases,
    }),
  ],
  render: () => (
    <ToolFrame>
      <StoryRouter router={variantsToolRouter}>
        <VariantsTool />
      </StoryRouter>
    </ToolFrame>
  ),
}

/**
 * The create dialog (also reachable from the overview's "Create variant
 * definition" button): title, description, and the conditions editor with
 * key/value autocomplete. Validation is live (`getIsVariantInvalid`); submit
 * runs the real operations store against the mock client.
 */
export const CreateDialog: Story = {
  parameters: {docs: {story: {inline: false, height: '640px'}}},
  render: () => (
    <StoryRouter router={variantsToolRouter}>
      <CreateVariantDialog onCancel={() => undefined} onSubmit={() => undefined} />
    </StoryRouter>
  ),
}

/**
 * The navbar "View as" row the plugin appends below the studio navbar: a
 * Version selector (the releases nav) and a Variant selector side by side.
 * The router is stateful, so picking a variant from the menu really sets the
 * `variant` sticky param, the label switches to the selection and the Clear
 * button animates in. `renderDefault` is stubbed with a placeholder bar; the
 * row below it is the real component tree.
 */
export const NavbarViewAs: Story = {
  parameters: {docs: {story: {inline: false, height: '480px'}}},
  render: () => (
    <StoryRouter router={navbarRouter}>
      <VariantsStudioNavbar
        {...({
          renderDefault: () => (
            <Card borderBottom padding={3} tone="transparent">
              <Text muted size={1}>
                Studio navbar (stubbed via renderDefault)
              </Text>
            </Card>
          ),
        } as unknown as NavbarProps)}
      />
    </StoryRouter>
  ),
}
