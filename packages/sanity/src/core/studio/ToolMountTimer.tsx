import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'

import {StudioToolMountTimeMeasured} from './__telemetry__/tools.telemetry'

// Module-level record of which tools have already mounted in this page
// session. Survives tool switches but is cleared by a hard reload/HMR.
// Using a `Set` means the check + update are cheap and the value for
// `isFirstMount` is deterministic even across StrictMode double-mount.
const mountedTools = new Set<string>()

interface ToolMountTimerProps {
  toolName: string
  /** ms since navigation start captured when this tool was selected */
  t0: number
}

/**
 * Invisible timer component rendered inside the active tool's `<Suspense>`
 * boundary. Its first `useEffect` runs only after the tool's lazy chunk
 * resolves and the tool's first render commits — capturing a fair "tool
 * is on screen" moment.
 *
 * One-shot per mount: the effect runs once. Because the parent
 * `<StudioErrorBoundary>` re-keys on `activeTool.name`, every tool
 * activation produces a fresh `<ToolMountTimer>` instance and therefore
 * exactly one event.
 */
export function ToolMountTimer({toolName, t0}: ToolMountTimerProps): null {
  const telemetry = useTelemetry()

  useEffect(() => {
    const isFirstMount = !mountedTools.has(toolName)
    mountedTools.add(toolName)
    telemetry.log(StudioToolMountTimeMeasured, {
      toolName,
      durationMs: performance.now() - t0,
      isFirstMount,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
