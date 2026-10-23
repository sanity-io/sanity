import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DiagnosticsReport} from '../DiagnosticsReport'
import {DIAGNOSTICS_FIXTURE} from './diagnosticsFixture'

/**
 * Shows a complete diagnostics report with multiple styled-components runtimes so the rule count,
 * generated CSS size, version warning, and per-runtime summary stay visually covered.
 */
export function DiagnosticsReportStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <DiagnosticsReport
          diagnostics={DIAGNOSTICS_FIXTURE}
          onDownloadSchema={() => undefined}
          onRunAgain={() => undefined}
        />
      </Card>
    </TestWrapper>
  )
}
