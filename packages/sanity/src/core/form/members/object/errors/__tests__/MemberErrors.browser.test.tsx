import {type ArraySchemaType} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DuplicateKeysAlert} from '../DuplicateKeysAlert'
import {MissingKeysAlert} from '../MissingKeysAlert'
import {MixedArrayAlert} from '../MixedArrayAlert'

const ARRAY_SCHEMA_TYPE = {
  jsonType: 'array',
  name: 'fixtureItems',
  title: 'Related items',
  description: 'A fixture array used to show member errors.',
  of: [],
} as unknown as ArraySchemaType

function MemberErrorsHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 720}}>
        <Stack gap={4}>
          <DuplicateKeysAlert
            error={{
              type: 'DUPLICATE_KEYS',
              schemaType: ARRAY_SCHEMA_TYPE,
              duplicates: [
                [0, 'duplicate-key'],
                [1, 'duplicate-key'],
              ],
            }}
            onChange={noop}
            path={['duplicateItems']}
          />
          <MissingKeysAlert
            error={{type: 'MISSING_KEYS', schemaType: ARRAY_SCHEMA_TYPE, value: [{}, {}]}}
            onChange={noop}
            path={['missingItems']}
          />
          <MixedArrayAlert
            error={{
              type: 'MIXED_ARRAY',
              schemaType: ARRAY_SCHEMA_TYPE,
              value: [{_type: 'fixtureItem'}, 'Unexpected primitive'],
            }}
            onChange={noop}
            path={['mixedItems']}
          />
        </Stack>
      </Card>
    </TestWrapper>
  )
}

describe('form member errors', () => {
  test('renders each error with its developer details expanded', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<MemberErrorsHarness />)

    await expect.element(page.getByText('Non-unique keys')).toBeVisible()
    const detailsButtons = Array.from(document.querySelectorAll('button')).filter((button) =>
      button.textContent?.includes('Developer info'),
    )
    expect(detailsButtons).toHaveLength(3)
    for (const button of detailsButtons) {
      if (button.nextElementSibling?.hasAttribute('hidden')) {
        await userEvent.click(button)
      }
    }
    await expect.element(page.getByText('Invalid list values')).toBeVisible()
    await settleChromaticEndState()
  })
})
