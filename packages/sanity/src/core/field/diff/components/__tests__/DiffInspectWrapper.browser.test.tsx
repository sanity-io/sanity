import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../hooks/useSchema'
import {type AnnotationDetails, type ObjectDiff} from '../../../types'
import {buildObjectChangeList} from '../../changes/buildChangeList'
import {isFieldChange} from '../../helpers'
import {DiffInspectWrapper} from '../DiffInspectWrapper'
import {FallbackDiff} from '../FallbackDiff'

const {settleChromaticEndState} = testHelpers()

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

const SCHEMA_TYPES = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]

const FROM = {_id: 'article-1', _type: 'article', title: 'Old title'}
const TO = {_id: 'article-1', _type: 'article', title: 'New title'}

// A single changed field produces one FieldChangeNode with its diff component
// resolved, the same node `FieldChange` hands to the wrapper.
function DiffInspectWrapperHarness() {
  const schema = useSchema()
  const change = useMemo(() => {
    const schemaType = schema.get('article') as ObjectSchemaType
    const diff = diffInput(wrap(FROM, ANNOTATION), wrap(TO, ANNOTATION)) as ObjectDiff
    const [node] = buildObjectChangeList(schemaType, diff)
    if (!node || !isFieldChange(node)) throw new Error('Expected a field change node')
    return node
  }, [schema])
  const DiffComponent = change.diffComponent || FallbackDiff

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <DiffInspectWrapper change={change} data-testid="diff-inspect-wrapper" padding={2}>
        <DiffComponent diff={change.diff} schemaType={change.schemaType as ObjectSchemaType} />
      </DiffInspectWrapper>
    </Card>
  )
}

describe('DiffInspectWrapper', () => {
  it('swaps the diff for the raw inspector on Meta+I while hovered', async () => {
    void render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <DiffInspectWrapperHarness />
      </TestWrapper>,
    )

    const wrapper = page.getByTestId('diff-inspect-wrapper')
    await expect.element(wrapper.getByText('New title')).toBeVisible()
    expect(wrapper.getByText('Meta', {exact: true}).elements()).toHaveLength(0)

    // The shortcut only applies to the change under the pointer.
    await userEvent.hover(wrapper)
    await userEvent.keyboard('{Meta>}i{/Meta}')

    await expect.element(wrapper.getByText('Meta', {exact: true})).toBeVisible()
    await expect.element(wrapper.getByText('From', {exact: true})).toBeVisible()
    await expect.element(wrapper.getByText('To', {exact: true})).toBeVisible()
    await expect.element(wrapper.getByText('path: title')).toBeVisible()
    await expect.element(wrapper.getByText('"Old title"')).toBeVisible()
    await expect.element(wrapper.getByText('"New title"')).toBeVisible()

    await settleChromaticEndState()
  })
})
