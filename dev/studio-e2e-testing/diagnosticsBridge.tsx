import {definePlugin, type LayoutProps, StudioDiagnosticsBridge} from 'sanity'

function DiagnosticsBridgeLayout(props: LayoutProps) {
  return (
    <>
      <StudioDiagnosticsBridge />
      {props.renderDefault(props)}
    </>
  )
}

/**
 * Exposes `window.__sanityStudioDiagnostics` so the e2e failure fixture
 * (e2e/helpers/failureDiagnostics.ts) can capture a Studio diagnostics report
 * from tests that fail — see `captureStudioDiagnosticsOnFailure`.
 */
export const diagnosticsBridge = definePlugin({
  name: 'e2e-diagnostics-bridge',
  studio: {
    components: {
      layout: DiagnosticsBridgeLayout,
    },
  },
})
