import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'

const FIXTURE_ERROR = new Error('The fixture input could not render')
FIXTURE_ERROR.stack = 'Error: The fixture input could not render\n    at FixtureInput'

function FixtureInput(): never {
  throw FIXTURE_ERROR
}

function FormBuilderInputErrorBoundaryHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FormBuilderInputErrorBoundary>
        <FixtureInput />
      </FormBuilderInputErrorBoundary>
    </TestWrapper>
  )
}

describe('form builder input error boundary', () => {
  test('renders a stable input error with its call stack', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormBuilderInputErrorBoundaryHarness />)

    await expect
      .element(page.getByText('Error: The fixture input could not render', {exact: true}))
      .toBeVisible()
    await expect.element(page.getByText('Call stack')).toBeVisible()
    await settleChromaticEndState()
  })
})
