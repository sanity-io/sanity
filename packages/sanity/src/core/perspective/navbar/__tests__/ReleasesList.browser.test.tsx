import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {type ReactNode, type RefObject, useState} from 'react'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PluginOptions} from '../../../config/types'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleaseStore} from '../../../releases/store/types'
import {
  type AgentBundle,
  type AgentBundlesStore,
} from '../../../store/agent/createAgentBundlesStore'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useResourceCache} from '../../../store/ResourceCacheProvider'
import {useWorkspace} from '../../../studio/workspace'
import {ReleasesList} from '../ReleasesList'
import {type ScrollElement} from '../useScrollIndicatorVisibility'

const SCROLL_REF: RefObject<ScrollElement> = {current: null}
const AGENT_BUNDLE: AgentBundle = {id: 'agent-test', applicationKey: 'test-app'}

const SYSTEM = ['release-published', 'release-drafts']
const RELEASE_ACTIONS = ['view-content-releases-menu-item', 'create-new-release-button']

interface Seeds {
  releases: ReleaseDocument[]
  agentBundles: AgentBundle[]
}

/**
 * `useReleasesStore` and `useAgentBundlesStore` keep one store per workspace in the resource
 * cache and only create one on a miss, so seeding the cache before the list mounts is how
 * fixture data reaches it without a client that can answer the queries. The seeding runs in a
 * state initializer rather than an effect: it has to happen before the children's store hooks
 * read the cache in their first render, or they would create real stores against the mock
 * client. StrictMode's second run writes the same keys again.
 */
function SeedStores({releases, agentBundles, children}: Seeds & {children: ReactNode}) {
  const workspace = useWorkspace()
  const previewStore = useDocumentPreviewStore()
  const resourceCache = useResourceCache()
  useState(() => {
    const releasesStore: ReleaseStore = {
      state$: of({
        releases: new Map(releases.map((release) => [release._id, release])),
        state: 'loaded',
      }),
      errorCount$: of(0),
      getMetadataStateForSlugs$: () => of({data: null, error: null, loading: false}),
      dispatch: noop,
    }
    const agentBundlesStore: AgentBundlesStore = {
      state$: of({bundles: agentBundles, loading: false}),
    }
    resourceCache.set({
      dependencies: [workspace, previewStore],
      namespace: 'ReleasesStore',
      value: releasesStore,
    })
    resourceCache.set({
      dependencies: [workspace],
      namespace: 'AgentBundlesStore',
      value: agentBundlesStore,
    })
  })

  return children
}

interface HarnessProps extends Partial<Seeds> {
  areReleasesEnabled: boolean
  draftsEnabled?: boolean
}

interface Variant extends HarnessProps {
  name: string
  /** The parts top to bottom, each by its menu items, with one `'line'` per pixel of separator */
  expected: (string | string[])[]
}

/**
 * Scheduled drafts stay off: the feature check behind that action answers "enabled" while the
 * `/features` request is in flight, so against the mock client the action would be in the first
 * paint and gone one commit later. The combinations with it are in `ReleasesList.test.tsx`.
 */
const harnessSettings = (draftsEnabled: boolean): PluginOptions => ({
  name: 'harness-settings',
  scheduledDrafts: {enabled: false},
  document: {drafts: {enabled: draftsEnabled}},
})
const DRAFTS_ON = [harnessSettings(true)]
const DRAFTS_OFF = [harnessSettings(false)]

const NONE: never[] = []

function ReleasesListHarness({
  areReleasesEnabled,
  releases = NONE,
  agentBundles = NONE,
  draftsEnabled = true,
}: HarnessProps) {
  return (
    <TestWrapper schemaTypes={[]} plugins={draftsEnabled ? DRAFTS_ON : DRAFTS_OFF}>
      <SeedStores releases={releases} agentBundles={agentBundles}>
        <Card radius={3} shadow={2} style={{width: 240}}>
          <Menu gap={0} padding={0}>
            <ReleasesList
              areReleasesEnabled={areReleasesEnabled}
              handleOpenBundleDialog={noop}
              isRangeVisible
              scrollElementRef={SCROLL_REF}
              selectedPerspectiveName={undefined}
              setScrollContainer={noop}
            />
          </Menu>
        </Card>
      </SeedStores>
    </TestWrapper>
  )
}

const px = (value: string) => Math.round(parseFloat(value))

/**
 * The list from top to bottom: each card as its menu items (by test id, falling back to text),
 * and between them one `'line'` per pixel drawn by a card border or a `MenuDivider`. Lines
 * before the first card or after the last one show up in the same way, so a leading or
 * trailing separator fails the comparison, as does a card with nothing in it (`[]`).
 */
function getLayout(): (string | string[])[] {
  const root = page
    .getByTestId('release-published')
    .element()
    .closest('[data-ui="Card"]')!.parentElement!
  const parts = Array.from(root.children).flatMap((part) =>
    part.getAttribute('data-ui') === 'scroll-wrapper' ? Array.from(part.children) : [part],
  )

  const layout: (string | string[])[] = []
  const pushLines = (count: number) => layout.push(...Array.from({length: count}, () => 'line'))
  let lines = 0
  for (const part of parts) {
    const style = getComputedStyle(part)
    if (part.getAttribute('data-ui') === 'MenuDivider') {
      lines += px(style.height)
      continue
    }
    pushLines(lines + px(style.borderTopWidth))
    layout.push(
      Array.from(
        part.querySelectorAll('[data-ui="MenuItem"]'),
        (item) => item.getAttribute('data-testid') ?? item.textContent,
      ),
    )
    lines = px(style.borderBottomWidth)
  }
  pushLines(lines)
  return layout
}

const VARIANTS: Variant[] = [
  {
    name: 'releases disabled',
    areReleasesEnabled: false,
    expected: [SYSTEM],
  },
  {
    name: 'releases enabled, none created',
    areReleasesEnabled: true,
    expected: [SYSTEM, 'line', RELEASE_ACTIONS],
  },
  {
    name: 'one release of each type',
    areReleasesEnabled: true,
    releases: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
    expected: [
      SYSTEM,
      'line',
      ['release-rASAP'],
      'line',
      ['release-rActive'],
      'line',
      ['release-rUndecided'],
      'line',
      RELEASE_ACTIONS,
    ],
  },
  {
    name: 'agent bundle, releases disabled',
    areReleasesEnabled: false,
    agentBundles: [AGENT_BUNDLE],
    expected: [SYSTEM, 'line', ['Proposed changes']],
  },
  {
    name: 'agent bundle and one release',
    areReleasesEnabled: true,
    agentBundles: [AGENT_BUNDLE],
    releases: [activeASAPRelease],
    expected: [
      SYSTEM,
      'line',
      ['Proposed changes'],
      'line',
      ['release-rASAP'],
      'line',
      RELEASE_ACTIONS,
    ],
  },
  {
    name: 'drafts disabled, releases disabled',
    areReleasesEnabled: false,
    draftsEnabled: false,
    expected: [['release-published']],
  },
  {
    name: 'drafts disabled, releases enabled',
    areReleasesEnabled: true,
    draftsEnabled: false,
    expected: [['release-published'], 'line', RELEASE_ACTIONS],
  },
]

describe('ReleasesList', () => {
  test.each(VARIANTS)('$name', async ({name: _name, expected, ...props}) => {
    void render(<ReleasesListHarness {...props} />)
    await expect.element(page.getByTestId('release-published')).toBeVisible()
    // The seeded stores deliver their values on commit, and the permission check behind
    // "New release" settles after the first paint, so the layout takes a few frames to settle.
    if (props.areReleasesEnabled) {
      await expect.element(page.getByTestId('create-new-release-button')).toBeEnabled()
    }
    await expect.poll(getLayout).toEqual(expected)
  })
})
