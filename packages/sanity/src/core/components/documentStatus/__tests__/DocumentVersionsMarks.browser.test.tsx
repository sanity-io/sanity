import {type ObjectSchemaType} from '@sanity/types'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {defineField, defineType} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ReferencePreview} from '../../../form/inputs/ReferenceInput/ReferencePreview'
import {useSchema} from '../../../hooks/useSchema'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {SearchResultItemPreview} from '../../../studio/components/navbar/search/components/searchResults/item/SearchResultItemPreview'
import {useAllVariants} from '../../../variants/store/useAllVariants'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))
// The preview store listens on the mock client and never emits: hand the rows a settled preview
vi.mock('../../../preview/utils/getPreviewStateObservable', () => ({
  getPreviewStateObservable: () =>
    of({isLoading: false, snapshot: {title: 'Ada Lovelace'}, original: null}),
}))

const GROUP_ID = 'author-1'

function version(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'author',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {bundleId, group: {_ref: GROUP_ID, _weak: true}},
  }
}

const versions = [
  version(GROUP_ID),
  version(`drafts.${GROUP_ID}`, 'drafts'),
  version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, activeASAPRelease.name),
]

const schemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

function SearchResult() {
  const schemaType = useSchema().get('author')
  if (!schemaType) return null
  return (
    <div data-testid="row" style={{width: 600}}>
      <SearchResultItemPreview
        documentId={GROUP_ID}
        documentType="author"
        quietVersionsStatus
        schemaType={schemaType}
      />
    </div>
  )
}

function ReferenceValue() {
  const refType = useSchema().get('author') as ObjectSchemaType | undefined
  if (!refType) return null
  return (
    <div data-testid="row" style={{width: 600}}>
      <ReferencePreview
        id={GROUP_ID}
        layout="default"
        quietVersionsStatus
        refType={refType}
        // What the form's preview does with these props: the default preview, with the status and
        // the tooltip the reference hands it
        renderPreview={(props) => (
          <SanityDefaultPreview
            layout="default"
            status={props.children as ReactNode}
            title="Ada Lovelace"
            tooltip={'tooltip' in props ? (props.tooltip as ReactNode) : undefined}
          />
        )}
      />
    </div>
  )
}

function Harness(props: {inventory: boolean; children: ReactNode}) {
  return (
    <TestWrapper
      betaFeatures={{documentGroupInventory: {enabled: props.inventory}}}
      schemaTypes={schemaTypes}
    >
      {props.children}
    </TestWrapper>
  )
}

/** Whether any popover (a tooltip or a flyout) is on screen. */
function anyPopoverShown() {
  return [...document.querySelectorAll('[data-ui="Popover"]')].some((element) =>
    element.checkVisibility(),
  )
}

async function restThenExpectNothing() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  expect(anyPopoverShown()).toBe(false)
  expect(page.getByTestId('document-versions-status').elements()).toHaveLength(0)
  expect(page.getByTestId('document-versions-flyout').elements()).toHaveLength(0)
}

beforeEach(() => {
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
})

describe.each([
  ['search result', SearchResult],
  ['reference field preview', ReferenceValue],
])('%s with the document group inventory', (_name, Row) => {
  it('opens nothing on a hover of the row or of the marks', async () => {
    await render(
      <Harness inventory>
        <Row />
      </Harness>,
    )
    await expect.element(page.getByText('Ada Lovelace')).toBeVisible()
    const marks = page.getByTestId('document-versions-marks')
    await expect.element(marks).toBeVisible()

    await userEvent.hover(page.getByText('Ada Lovelace'))
    await restThenExpectNothing()
    await userEvent.hover(marks)
    await restThenExpectNothing()
  })

  it('keeps a spoken summary on the marks', async () => {
    await render(
      <Harness inventory>
        <Row />
      </Harness>,
    )
    await expect.element(page.getByRole('group', {name: '3 versions', exact: true})).toBeVisible()
  })
})

describe.each([
  ['search result', SearchResult],
  ['reference field preview', ReferenceValue],
])('%s without the document group inventory', (_name, Row) => {
  it("keeps main's versions tooltip on a row hover", async () => {
    await render(
      <Harness inventory={false}>
        <Row />
      </Harness>,
    )
    await expect.element(page.getByText('Ada Lovelace')).toBeVisible()
    expect(page.getByTestId('document-versions-marks').elements()).toHaveLength(0)
    await userEvent.hover(page.getByText('Ada Lovelace'))
    await expect.poll(anyPopoverShown, {timeout: 3000}).toBe(true)
    await expect.element(page.getByTestId('document-versions-status')).toBeVisible()
  })
})
