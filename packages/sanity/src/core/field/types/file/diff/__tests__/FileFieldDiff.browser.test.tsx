import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import noop from 'lodash-es/noop.js'
import {useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {isShown, settleOpenTooltip} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../../../config/types'
import {useSchema} from '../../../../../hooks/useSchema'
import {LocaleProvider} from '../../../../../i18n/components/LocaleProvider'
import {ActiveWorkspaceMatcherProvider} from '../../../../../studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type AnnotationDetails, type ObjectDiff} from '../../../../types'
import {FileFieldDiff} from '../FileFieldDiff'
import {type File, type FileAsset} from '../types'

// `useRefValue` resolves the referenced assets with `client.observable.getDocument`,
// which the mock client does not implement; the asset documents are fixtures.
vi.mock(import('../../../../diff/hooks/useRefValue'), () => {
  const assets: Record<string, FileAsset> = {
    'file-old': {originalFilename: 'brochure-2019.pdf', size: 1_200_000},
    'file-new': {originalFilename: 'brochure-2020.pdf', size: 1_500_000},
  }
  return {
    useRefValue: <T,>(refId: string | undefined | null) =>
      (refId ? assets[refId] : undefined) as T | undefined,
  }
})

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

// `useDocumentOperation` (the nested change's revert button) reads the active
// workspace for comlink history capture; `TestWrapper` mounts no matcher.
const ACTIVE_WORKSPACE = {
  name: 'default',
  projectId: 'test',
  dataset: 'test',
} as WorkspaceSummary
const HISTORY = createMemoryHistory()

const SCHEMA_TYPES = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {
        name: 'attachment',
        title: 'Attachment',
        type: 'file',
        fields: [{name: 'description', title: 'Description', type: 'string'}],
      },
    ],
  },
]

const FROM = {_type: 'file', asset: {_ref: 'file-old'}, description: 'Print edition'}
const TO = {_type: 'file', asset: {_ref: 'file-new'}, description: 'Web edition'}

function PassthroughFieldWrapper(props: {children: React.ReactNode}) {
  return props.children
}

const openTooltipText = () =>
  Array.from(document.querySelectorAll('[data-ui="Tooltip"]'))
    .filter(isShown)
    .map((tooltip) => tooltip.textContent)

// A replaced asset (from/to cards with the size delta badge) next to a changed
// nested field, so both branches of the diff component render.
function FileFieldDiffHarness() {
  const schema = useSchema()
  const {documentChange, diff, schemaType} = useMemo(() => {
    const article = schema.get('article') as ObjectSchemaType
    const fileType = article.fields.find((field) => field.name === 'attachment')
      ?.type as ObjectSchemaType
    const fileDiff = diffInput(wrap(FROM, ANNOTATION), wrap(TO, ANNOTATION)) as ObjectDiff<File>
    const context: DocumentChangeContextInstance = {
      documentId: 'article-1',
      schemaType: article,
      rootDiff: fileDiff,
      isComparingCurrent: true,
      FieldWrapper: PassthroughFieldWrapper,
      value: TO,
      showFromValue: true,
    }
    return {documentChange: context, diff: fileDiff, schemaType: fileType}
  }, [schema])

  return (
    <DocumentChangeContext.Provider value={documentChange}>
      <Card padding={4} style={{maxWidth: 480}}>
        <FileFieldDiff diff={diff} schemaType={schemaType} />
      </Card>
    </DocumentChangeContext.Provider>
  )
}

describe('FileFieldDiff', () => {
  it('renders the replaced asset with its size delta and the changed nested field', async () => {
    void render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <LocaleProvider>
          <ActiveWorkspaceMatcherProvider
            activeWorkspace={ACTIVE_WORKSPACE}
            history={HISTORY}
            setActiveWorkspace={noop}
          >
            <FileFieldDiffHarness />
          </ActiveWorkspaceMatcherProvider>
        </LocaleProvider>
      </TestWrapper>,
    )

    // From / to asset cards: filename, human friendly size and the delta badge.
    await expect.element(page.getByText('brochure-2019.pdf', {exact: true})).toBeVisible()
    await expect.element(page.getByText('1.2 MB', {exact: true})).toBeVisible()
    await expect.element(page.getByText('brochure-2020.pdf', {exact: true})).toBeVisible()
    await expect.element(page.getByText('1.5 MB', {exact: true})).toBeVisible()
    await expect.element(page.getByText('+25%', {exact: true})).toBeVisible()

    // The nested `description` field renders as its own change below the asset.
    await expect.element(page.getByText('Description', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Print', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Web', {exact: true})).toBeVisible()

    // Hovering the asset cards opens the change tooltip for `asset._ref`. The
    // nested string diff keeps its own (closed) tooltips mounted, so read the
    // visible one rather than querying the page for its text.
    await userEvent.hover(page.getByText('brochure-2020.pdf', {exact: true}))
    // Heading, avatar initial, display name, relative time.
    await expect.poll(openTooltipText).toEqual(['ChangedDDougJun 15, 2020'])

    await settleOpenTooltip()
  })
})
