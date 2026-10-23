import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import type * as environment from '../../environment'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'

// Under `isDev` the card also renders React's generated component stack, whose
// frames carry the dev server's port and the dependency optimizer's hashes —
// both change between runs, so the archived card would never match itself.
// Production is the build this UI ships in; the call-stack block it does render
// is the part this test asserts.
vi.mock('../../environment', async (importOriginal) => ({
  ...(await importOriginal<typeof environment>()),
  isDev: false,
  isProd: true,
}))

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
    await expect.element(page.getByText('Component stack')).not.toBeInTheDocument()
    await settleChromaticEndState()
  })
})
