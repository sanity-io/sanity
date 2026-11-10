import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import noop from 'lodash-es/noop.js'
import {useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'
import {VStack} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../../config/types'
import {useSchema} from '../../../../hooks/useSchema'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {ActiveWorkspaceMatcherProvider} from '../../../../studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {type AnnotationDetails, type ObjectDiff} from '../../../types'
import {buildObjectChangeList} from '../../changes/buildChangeList'
import {type DocumentChangeContextInstance} from '../../contexts/DocumentChangeContext'
import {ChangeResolver} from '../ChangeResolver'

const {settleChromaticEndState} = testHelpers()

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

// `useDocumentOperation` (revert buttons) reads the active workspace for
// comlink history capture; `TestWrapper` mounts no matcher.
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
      {name: 'title', title: 'Title', type: 'string'},
      {
        name: 'author',
        title: 'Author',
        type: 'object',
        fields: [
          {name: 'name', title: 'Name', type: 'string'},
          {name: 'role', title: 'Role', type: 'string'},
        ],
      },
    ],
  },
]

const FROM = {
  _id: 'article-1',
  _type: 'article',
  title: 'Old title',
  author: {name: 'Ann', role: 'Editor'},
}
const TO = {
  _id: 'article-1',
  _type: 'article',
  title: 'New title',
  author: {name: 'Anna', role: 'Writer'},
}

function PassthroughFieldWrapper(props: {children: React.ReactNode}) {
  return props.children
}

// One top-level field change next to a nested group (two changed fields of
// the `author` object), so the resolver takes both of its branches.
function ChangeResolverHarness() {
  const schema = useSchema()
  const {documentChange, changes} = useMemo(() => {
    const schemaType = schema.get('article') as ObjectSchemaType
    const rootDiff = diffInput(wrap(FROM, ANNOTATION), wrap(TO, ANNOTATION)) as ObjectDiff
    const [root] = buildObjectChangeList(schemaType, rootDiff)
    if (!root || root.type !== 'group') throw new Error('Expected a root group change')
    const context: DocumentChangeContextInstance = {
      documentId: 'article-1',
      schemaType,
      rootDiff,
      isComparingCurrent: true,
      FieldWrapper: PassthroughFieldWrapper,
      value: TO,
      showFromValue: true,
    }
    return {documentChange: context, changes: root.changes}
  }, [schema])

  return (
    <DocumentChangeContext.Provider value={documentChange}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          {changes.map((change) => (
            <ChangeResolver
              key={change.key}
              change={change}
              addParentWrapper={change.path.length > 1}
            />
          ))}
        </VStack>
      </Card>
    </DocumentChangeContext.Provider>
  )
}

describe('ChangeResolver', () => {
  it('renders a field change and a nested group change with their breadcrumbs', async () => {
    // The state worth archiving is the group's revert button hovered (label
    // revealed, `data-revert-group-hover` flagging the group content).
    // `settleChromaticEndState` parks the pointer and clears both, so the
    // automatic end-of-test snapshot cannot show them: snapshot while hovered
    // and settle only for cleanup.
    configure({disableAutoSnapshot: true})
    void render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <LocaleProvider>
          <ActiveWorkspaceMatcherProvider
            activeWorkspace={ACTIVE_WORKSPACE}
            history={HISTORY}
            setActiveWorkspace={noop}
          >
            <ChangeResolverHarness />
          </ActiveWorkspaceMatcherProvider>
        </LocaleProvider>
      </TestWrapper>,
    )

    // Field change: breadcrumb title, removed / added string segments and its
    // own (single change) revert button.
    await expect.element(page.getByText('Title', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Old', {exact: true})).toBeVisible()
    await expect.element(page.getByText('New', {exact: true})).toBeVisible()
    await expect
      .element(page.getByTestId('single-change-revert-button-title'))
      .toHaveTextContent('Revert change')

    // Group change: one breadcrumb for the object, a nested field change per
    // changed member and a single revert button for the group.
    await expect.element(page.getByText('Author', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Name', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Role', {exact: true})).toBeVisible()
    const groupRevert = page.getByTestId('group-change-revert-button-author')
    await expect.element(groupRevert).toHaveTextContent('Revert changes')

    // Hovering the group's revert button reveals its label and flags every
    // change it would revert.
    const content = document.querySelector('[data-ui="group-change-content"]')
    expect(content).not.toBeNull()
    expect(content).not.toHaveAttribute('data-revert-group-hover')
    await userEvent.hover(groupRevert)
    await expect.element(groupRevert.getByText('Revert changes', {exact: true})).toBeVisible()
    await expect.poll(() => content?.hasAttribute('data-revert-group-hover')).toBe(true)

    // Revealing the label widens the button; archive once that layout (and
    // the fonts it is measured with) has settled.
    if (typeof document.fonts?.ready !== 'undefined') {
      await document.fonts.ready
    }
    await expectStable(() => {
      const rect = groupRevert.element().getBoundingClientRect()
      return `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`
    })
    await takeSnapshot('group-revert-hovered')

    await settleChromaticEndState()
    expect(content).not.toHaveAttribute('data-revert-group-hover')
  })
})
