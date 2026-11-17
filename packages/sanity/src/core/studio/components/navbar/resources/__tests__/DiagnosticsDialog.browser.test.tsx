import noop from 'lodash-es/noop.js'
import {WorkspacesContext} from 'sanity/_singletons'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {DiagnosticsDialog} from '../DiagnosticsDialog'
import {DIAGNOSTICS_FIXTURE} from './diagnosticsFixture'

// The real gatherer probes the API (latency, listen, protocol); answer with a
// fixed, successful report instead so the dialog renders the settled state.
vi.mock('../../../../diagnostics/gatherStudioDiagnostics', async (importOriginal) => ({
  ...(await importOriginal()),
  gatherStudioDiagnostics: () => Promise.resolve(DIAGNOSTICS_FIXTURE),
}))

const WORKSPACES = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])

function DiagnosticsDialogHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <WorkspacesContext.Provider value={WORKSPACES}>
        <DiagnosticsDialog onClose={noop} />
      </WorkspacesContext.Provider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the Studio diagnostics dialog once a run has finished:
 * the header, the report card with its sections, and the Close / Copy output
 * footer with the copy button enabled.
 */
describe('DiagnosticsDialog', () => {
  test('renders the finished report with the copy action enabled', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<DiagnosticsDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Studio diagnostics')).toBeVisible()
    await expect.element(dialog.getByText('Storybook workspace')).toBeVisible()
    await expect.element(dialog.getByTestId('confirm-button')).toHaveTextContent('Copy output')
    await expect.element(dialog.getByTestId('confirm-button')).toBeEnabled()
    await expect.element(dialog.getByTestId('cancel-button')).toHaveTextContent('Close')
    expect(dialog.getByText('Gathering diagnostics…').query()).toBeNull()

    await settleChromaticEndState()
  })
})
