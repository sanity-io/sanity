import {route, RouterProvider} from 'sanity/router'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {
  DocumentVersionsMarksFlyout,
  type MarksFlyoutSurface,
  REFERENCE_MARKS_SURFACE,
  SEARCH_RESULT_MARKS_SURFACE,
} from '../DocumentVersionsMarksFlyout'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))

const GROUP_ID = 'article-1'
const WIDE = {width: 1800, height: 900}
const DEFAULT_VIEWPORT = {width: 1280, height: 900}

function version(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {bundleId, group: {_ref: GROUP_ID, _weak: true}},
  }
}

// Published, a draft and a release version: the footer row shows
const versions = [
  version(GROUP_ID),
  version(`drafts.${GROUP_ID}`, 'drafts'),
  version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, activeASAPRelease.name),
]

const testRouter = route.create('/', [route.intents('/intent')])

type OnNavigate = Mock<(opts: {path: string; replace?: boolean}) => void>

/** The intent and params the last navigation went to. */
function lastIntent(onNavigate: OnNavigate) {
  const [{path}] = onNavigate.mock.lastCall as [{path: string}]
  return testRouter.decode(path.split('?')[0]) as {intent?: string; params?: Record<string, string>}
}

function Marks(props: {id: string; surface: MarksFlyoutSurface; onNavigate?: () => void}) {
  return (
    <DocumentVersionsMarksFlyout
      documentId={GROUP_ID}
      documentType="article"
      onNavigate={props.onNavigate}
      surface={props.surface}
      versionCount={versions.length}
    >
      <span
        data-testid={`marks-${props.id}`}
        style={{display: 'inline-block', width: 16, height: 16, background: 'currentColor'}}
      />
    </DocumentVersionsMarksFlyout>
  )
}

const RESULTS = ['a', 'b', 'c', 'd']

/** A search dialog as `SearchPopover` lays one out: 800px wide, centred, rows of results. */
function SearchHarness(props: {onNavigate: OnNavigate; onClose: () => void}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={testRouter} state={{}} onNavigate={props.onNavigate}>
        <div
          data-search-dialog=""
          data-testid="dialog"
          style={{
            position: 'fixed',
            top: 100,
            left: '50%',
            width: 'min(calc(100vw - 32px), 800px)',
            transform: 'translateX(-50%)',
          }}
        >
          {RESULTS.map((id) => (
            <a
              data-search-result-row=""
              data-testid={`result-${id}`}
              href={`#${id}`}
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 51,
                padding: '0 12px',
              }}
            >
              <span data-testid={`body-${id}`}>Result {id}</span>
              <Marks id={id} onNavigate={props.onClose} surface={SEARCH_RESULT_MARKS_SURFACE} />
            </a>
          ))}
        </div>
      </RouterProvider>
    </TestWrapper>
  )
}

/** A form with an array of references, then another field below it. */
function ReferenceHarness(props: {onNavigate: OnNavigate}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={testRouter} state={{}} onNavigate={props.onNavigate}>
        <div style={{position: 'fixed', top: 80, left: 100, width: 560}}>
          <div data-testid="field-authors" style={{padding: 8}}>
            {['first', 'second'].map((id) => (
              <div
                data-testid={`reference-${id}`}
                data-ui="ReferenceLinkCard"
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 45,
                }}
              >
                <span>Author {id}</span>
                <Marks id={id} surface={REFERENCE_MARKS_SURFACE} />
              </div>
            ))}
          </div>
          <div data-testid="field-title" style={{height: 60}}>
            Title
          </div>
        </div>
      </RouterProvider>
    </TestWrapper>
  )
}

function rect(testId: string): DOMRect {
  return page.getByTestId(testId).element().getBoundingClientRect()
}

function overlaps(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

const flyout = () => page.getByTestId('document-versions-marks-flyout')

/** Waits past the open delay and checks nothing opened. */
async function expectNoFlyout() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  expect(flyout().elements()).toHaveLength(0)
}

beforeEach(async () => {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
    data: [activeASAPRelease],
    byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
    loading: false,
    error: undefined,
  } as ReturnType<typeof useActiveReleases>)
  ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
    data: [],
    byId: new Map(),
    loading: false,
    error: undefined,
  })
  await page.viewport(WIDE.width, WIDE.height)
})

afterEach(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

describe('DocumentVersionsMarksFlyout in search results', () => {
  it('opens beside the dialog on a marks hover, top aligned with the row, over no result', async () => {
    await render(<SearchHarness onClose={vi.fn()} onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByTestId('marks-b'))
    await expect.element(flyout()).toBeVisible()
    await expect.element(page.getByTestId('document-versions-flyout')).toBeVisible()

    const panel = rect('document-versions-flyout')
    const dialog = rect('dialog')
    expect(panel.left).toBeGreaterThanOrEqual(dialog.right)
    expect(Math.abs(panel.top - rect('result-b').top)).toBeLessThanOrEqual(1)
    for (const id of RESULTS) expect(overlaps(panel, rect(`result-${id}`))).toBe(false)
    expect(overlaps(panel, dialog)).toBe(false)
    // The same content as the list: audience rows and the footer
    await expect
      .element(page.getByTestId('document-versions-flyout-inventory'))
      .toMatchTextContent('See all versions in the inventory')
  })

  it('opens nothing on a hover of the row body', async () => {
    await render(<SearchHarness onClose={vi.fn()} onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByTestId('body-b'))
    await expectNoFlyout()
  })

  it('opens nothing when neither side of the dialog has room', async () => {
    await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    await render(<SearchHarness onClose={vi.fn()} onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByTestId('marks-b'))
    await expectNoFlyout()
  })

  it('stays open on the way to the flyout and closes after leaving it', async () => {
    await render(<SearchHarness onClose={vi.fn()} onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByTestId('marks-a'))
    await expect.element(flyout()).toBeVisible()
    await userEvent.hover(page.getByTestId('document-versions-flyout-inventory'))
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect.element(flyout()).toBeVisible()
    await userEvent.hover(page.getByTestId('body-d'))
    await expect.poll(() => flyout().elements().length, {timeout: 2000}).toBe(0)
  })

  it('opens the document with the inventory from the footer, and closes the search', async () => {
    const onNavigate: OnNavigate = vi.fn()
    const onClose = vi.fn()
    await render(<SearchHarness onClose={onClose} onNavigate={onNavigate} />)
    await userEvent.hover(page.getByTestId('marks-c'))
    await expect.element(flyout()).toBeVisible()
    await userEvent.click(page.getByTestId('document-versions-flyout-inventory'))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(lastIntent(onNavigate)).toMatchObject({
      intent: 'edit',
      params: {id: GROUP_ID, type: 'article', inspect: 'sanity/structure/document-group'},
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(flyout().elements()).toHaveLength(0)
    // The click did not also follow the row's link
    expect(window.location.hash).not.toBe('#c')
  })
})

describe('DocumentVersionsMarksFlyout in reference previews', () => {
  it('opens beside the field on a marks hover, over neither the next item nor the next field', async () => {
    await render(<ReferenceHarness onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByTestId('marks-first'))
    await expect.element(flyout()).toBeVisible()

    const panel = rect('document-versions-flyout')
    expect(panel.left).toBeGreaterThanOrEqual(rect('field-authors').right)
    expect(Math.abs(panel.top - rect('reference-first').top)).toBeLessThanOrEqual(1)
    expect(overlaps(panel, rect('field-authors'))).toBe(false)
    expect(overlaps(panel, rect('reference-second'))).toBe(false)
    expect(overlaps(panel, rect('field-title'))).toBe(false)
  })

  it('opens nothing on a hover of the reference body', async () => {
    await render(<ReferenceHarness onNavigate={vi.fn()} />)
    await userEvent.hover(page.getByText('Author first'))
    await expectNoFlyout()
  })

  it('opens the referenced document with the inventory from the footer', async () => {
    const onNavigate: OnNavigate = vi.fn()
    await render(<ReferenceHarness onNavigate={onNavigate} />)
    await userEvent.hover(page.getByTestId('marks-second'))
    await expect.element(flyout()).toBeVisible()
    await userEvent.click(page.getByTestId('document-versions-flyout-inventory'))
    expect(lastIntent(onNavigate)).toMatchObject({
      intent: 'edit',
      params: {id: GROUP_ID, inspect: 'sanity/structure/document-group'},
    })
  })

  it('opens the document in the picked audience, with the inventory', async () => {
    const onNavigate: OnNavigate = vi.fn()
    await render(<ReferenceHarness onNavigate={onNavigate} />)
    await userEvent.hover(page.getByTestId('marks-first'))
    await expect.element(flyout()).toBeVisible()
    await userEvent.click(page.getByTestId('document-versions-flyout-row').first())
    expect(lastIntent(onNavigate)).toMatchObject({
      intent: 'edit',
      params: {id: GROUP_ID, inspect: 'sanity/structure/document-group'},
    })
  })
})
