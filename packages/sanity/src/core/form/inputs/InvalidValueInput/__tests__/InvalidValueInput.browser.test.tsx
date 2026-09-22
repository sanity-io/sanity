import {defineField, defineType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {InvalidValueInput} from '../InvalidValueInput'
import {UntypedValueInput} from '../UntypedValueInput'

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'article',
    title: 'Article',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
  }),
]

function InvalidValueInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <Card padding={4} style={{maxWidth: 560}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid primitive value
            </Text>
            <InvalidValueInput
              actualType="number"
              onChange={noop}
              validTypes={['string']}
              value={42}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              object without a type
            </Text>
            <UntypedValueInput
              onChange={noop}
              validTypes={['article']}
              value={{title: 'Untyped article'}}
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}

describe('InvalidValueInput', () => {
  test('renders invalid and untyped values', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<InvalidValueInputHarness />)

    await expect.element(page.getByText('Invalid property value')).toBeVisible()
    await expect.element(page.getByText('Convert to article')).toBeVisible()
    await settleChromaticEndState()
  })
})
