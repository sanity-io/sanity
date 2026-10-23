import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type DocumentSystem} from '@sanity/types'
import {beforeEach, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {
  expectStable,
  snapFloatingUiToIntegerPixels,
  testHelpers,
} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import type * as UseRelativeTimeModule from '../../../hooks/useRelativeTime'
import type * as UseDocumentVersionsModule from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import type * as UseActiveReleasesModule from '../../../releases/store/useActiveReleases'
import type * as UseAgentBundlesModule from '../../../store/agent/useAgentBundles'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import type * as UseAllVariantsModule from '../../../variants/store/useAllVariants'
import {type SystemVariant} from '../../../variants/types'
import {DocumentVersionsStatus} from '../DocumentVersionsStatus'

// Each test ends with the tooltip closed again (settleChromaticEndState refuses an open one), so
// the state under test is snapshotted explicitly while it is open.
configure({disableAutoSnapshot: true})

const GROUP_ID = 'article-1'

let versions: VersionInfoDocumentStub[] = []
let variantsById = new Map<string, SystemVariant>()
let loading = false

vi.mock('../../../releases/hooks/useDocumentVersions', async (importOriginal) => ({
  ...(await importOriginal<typeof UseDocumentVersionsModule>()),
  useDocumentVersions: () => ({
    data: versions.map((version) => version._id),
    versions: loading ? [] : versions,
    error: null,
    loading,
  }),
}))

vi.mock('../../../releases/store/useActiveReleases', async (importOriginal) => ({
  ...(await importOriginal<typeof UseActiveReleasesModule>()),
  useActiveReleases: () => ({
    data: [],
    byId: new Map(),
    error: undefined,
    loading: false,
    dispatch: vi.fn(),
  }),
}))

vi.mock('../../../variants/store/useAllVariants', async (importOriginal) => ({
  ...(await importOriginal<typeof UseAllVariantsModule>()),
  useAllVariants: () => ({
    data: Array.from(variantsById.values()),
    byId: variantsById,
    loading: false,
    error: undefined,
  }),
}))

vi.mock('../../../store/agent/useAgentBundles', async (importOriginal) => ({
  ...(await importOriginal<typeof UseAgentBundlesModule>()),
  useAgentBundles: () => ({bundles: [], loading: false}),
}))

// Relative timestamps are live by nature; pin one so the archived tooltip is the same every run
vi.mock('../../../hooks/useRelativeTime', async (importOriginal) => ({
  ...(await importOriginal<typeof UseRelativeTimeModule>()),
  useRelativeTime: () => '3 wk. ago',
}))

function versionStub(id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T12:00:00.000Z',
    _updatedAt: '2026-01-02T12:00:00.000Z',
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  }
}

const variantRef = {_ref: variantAlphaAudience._id, _key: 'variant-key'}
const published = versionStub(GROUP_ID, {})
const draft = versionStub(`drafts.${GROUP_ID}`, {bundleId: 'drafts'})
const publishedVariant = versionStub(`published.alpha.${GROUP_ID}`, {variants: [variantRef]})
const draftVariant = versionStub(`drafts.alpha.${GROUP_ID}`, {
  bundleId: 'drafts',
  variants: [variantRef],
})

beforeEach(() => {
  versions = [published, draft]
  variantsById = new Map()
  loading = false
})

/**
 * Both tooltips in one tree: the standard studio tooltip — a `string` content, like the navbar's
 * "Tasks" button — is the reference the status tooltip's spacing is measured against.
 */
function TooltipHarness({variantsEnabled = false}: {variantsEnabled?: boolean}) {
  return (
    <TestWrapper
      betaFeatures={variantsEnabled ? {variants: {enabled: true}} : undefined}
      schemaTypes={[]}
    >
      <Tooltip content="Tasks" portal>
        <Button mode="bleed" text="Standard tooltip" />
      </Tooltip>
      <Tooltip content={<DocumentVersionsStatus documentGroupId={GROUP_ID} />} portal>
        <Button mode="bleed" text="Status tooltip" />
      </Tooltip>
    </TestWrapper>
  )
}

/** The open tooltip's card, if any. Closed `@sanity/ui` tooltips stay mounted, hidden. */
function findOpenTooltipCard(): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-ui="Tooltip__card"]')).find(
    (element) => element.getBoundingClientRect().width > 0,
  )
}

function openTooltipCard(): HTMLElement {
  const card = findOpenTooltipCard()
  if (!card) throw new Error('No open tooltip card')
  return card
}

/** How far the given elements stay clear of each edge of the tooltip card. */
function insets(card: HTMLElement, elements: Element[]) {
  const outer = card.getBoundingClientRect()
  const rects = elements.map((element) => element.getBoundingClientRect())

  return {
    top: Math.round(Math.min(...rects.map((rect) => rect.top)) - outer.top),
    bottom: Math.round(outer.bottom - Math.max(...rects.map((rect) => rect.bottom))),
    left: Math.round(Math.min(...rects.map((rect) => rect.left)) - outer.left),
    right: Math.round(outer.right - Math.max(...rects.map((rect) => rect.right))),
  }
}

function texts(card: HTMLElement): Element[] {
  const elements = Array.from(card.querySelectorAll('[data-ui="Text"]'))
  if (elements.length === 0) throw new Error('No text inside the tooltip')
  return elements
}

/**
 * The avatar column `DocumentVersionIcons` renders at the end of each row: its `Flex` wraps
 * `ReleaseAvatar`'s own `Flex` around the icon, which overshoots its box via a negative margin.
 */
function avatarColumn(avatar: Element): HTMLElement {
  const column = avatar.parentElement?.parentElement
  if (!column) throw new Error('No avatar column inside the tooltip')
  return column
}

function avatars(card: HTMLElement): HTMLElement[] {
  const found = Array.from(card.querySelectorAll<HTMLElement>('[data-testid^="release-avatar-"]'))
  if (found.length === 0) throw new Error('No release avatars inside the tooltip')
  return found
}

/**
 * Hover a trigger and wait for its tooltip to be rendered and settled. The card animates in
 * (`opacity` 0 → 1, `scale` .97 → 1) through WAAPI, which commits the end values to the inline
 * style only once it finishes — measuring or archiving before that reads a scaled-down box and
 * serializes `opacity: 0`, so Chromatic would render an empty frame.
 */
async function openTooltip(
  trigger: string,
  rendered: (card: HTMLElement) => boolean,
): Promise<HTMLElement> {
  await userEvent.hover(page.getByRole('button', {name: trigger}))
  await expect
    .poll(() => {
      const card = findOpenTooltipCard()
      return card ? rendered(card) : false
    })
    .toBe(true)

  const card = openTooltipCard()
  await expectStable(
    () => `${card.getAttribute('style')}|${JSON.stringify(card.getBoundingClientRect())}`,
  )
  snapFloatingUiToIntegerPixels()
  return card
}

function openStandardTooltip(): Promise<HTMLElement> {
  return openTooltip('Standard tooltip', (card) => card.textContent === 'Tasks')
}

function openStatusTooltip(): Promise<HTMLElement> {
  return openTooltip(
    'Status tooltip',
    (card) => card.querySelectorAll('[data-testid^="release-avatar-"]').length === versions.length,
  )
}

/** The tooltip card is the only thing that pads the content, on every edge. */
function expectStandardTextInsets(statusCard: HTMLElement, standard: ReturnType<typeof insets>) {
  const status = insets(statusCard, texts(statusCard))
  expect({top: status.top, bottom: status.bottom, left: status.left}).toEqual({
    top: standard.top,
    bottom: standard.bottom,
    left: standard.left,
  })
}

function onlyElement(parent: Element | null, what: string): HTMLElement {
  const element = parent?.firstElementChild
  if (!(element instanceof HTMLElement)) throw new Error(`No ${what} inside the tooltip`)
  return element
}

/** The title/timestamp stack of every version row, in document order. */
function titleStacks(card: HTMLElement): HTMLElement[] {
  return avatars(card).map((avatar) =>
    onlyElement(avatarColumn(avatar).parentElement, 'title stack'),
  )
}

/**
 * Open both tooltips in turn and assert the status tooltip's content keeps the same distance
 * from every edge as a standard studio tooltip's does. Leaves the status tooltip open.
 */
async function expectStandardInsets(): Promise<void> {
  const standardCard = await openStandardTooltip()
  const standard = insets(standardCard, texts(standardCard))

  const statusCard = await openStatusTooltip()
  expectStandardTextInsets(statusCard, standard)

  // Nothing pads the avatars off the right edge any more
  const column = avatarColumn(avatars(statusCard)[0])
  expect(insets(statusCard, [column]).right).toBe(standard.right)

  // …and they stay level with the title: `DocumentVersionIcons` centers its own content, so a
  // stretched row would drop the avatar between the title and the timestamp.
  const [first, second] = titleStacks(statusCard)
  expect(Math.round(column.getBoundingClientRect().top - first.getBoundingClientRect().top)).toBe(0)

  // The rows keep their own rhythm. What the content stack's negative margin trims off the
  // tooltip's top and bottom is a row's vertical padding, and two neighbouring rows contribute
  // one each, so they stay exactly twice that far apart.
  const trimmed = -parseFloat(
    window.getComputedStyle(onlyElement(statusCard, 'content stack')).marginTop,
  )
  expect(
    Math.round(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom),
  ).toBe(trimmed * 2)
}

it('insets the document status tooltip like a standard studio tooltip', async () => {
  const {settleChromaticEndState} = testHelpers()
  await render(<TooltipHarness />)

  await expectStandardInsets()

  await takeSnapshot('document status tooltip')

  // Parking the pointer closes the tooltip again
  await settleChromaticEndState()
})

it('keeps the same insets when variants split the versions into groups', async () => {
  const {settleChromaticEndState} = testHelpers()
  versions = [published, draft, publishedVariant, draftVariant]
  variantsById = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
  await render(<TooltipHarness variantsEnabled />)

  await expectStandardInsets()
  await expect.element(page.getByText('Alpha audience · Draft', {exact: true})).toBeVisible()

  await takeSnapshot('document status tooltip with variant groups')

  await settleChromaticEndState()
})

it('insets the loading state like a standard studio tooltip', async () => {
  const {settleChromaticEndState} = testHelpers()
  loading = true
  await render(<TooltipHarness />)

  const standard = insets(await openStandardTooltip(), texts(openTooltipCard()))
  const statusCard = await openTooltip('Status tooltip', (card) => card.textContent === 'Loading')
  expectStandardTextInsets(statusCard, standard)

  await settleChromaticEndState()
})
