import {type InvalidValueResolution} from '@portabletext/editor'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {InvalidValue} from '../InvalidValue'

const RESOLUTION = {
  action: 'resolve',
  description: 'Block is missing a required key',
  i18n: {
    action: 'inputs.portable-text.invalid-value.missing-key.action',
    description: 'inputs.portable-text.invalid-value.missing-key.description',
    values: {},
  },
  item: {_type: 'block', children: [{_type: 'span', text: 'Missing keys'}]},
  patches: [],
} as unknown as InvalidValueResolution

function InvalidValueHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <InvalidValue onChange={noop} onIgnore={noop} resolution={RESOLUTION} />
    </TestWrapper>
  )
}

describe('Portable Text invalid value', () => {
  test('renders the invalid value resolution', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<InvalidValueHarness />)

    await expect.element(page.getByText('Invalid Portable Text value')).toBeVisible()
    await settleChromaticEndState()
  })
})
