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
  /**
   * ms-since-navigation-start when this tool was selected. The parent
   * captures it during render when `activeToolName` changes (so it is
   * available before Activity-revealed child effects flush); we read it
   * in our own effect (after Suspense resolves and the tool's first
   * commit lands).
   */
  t0: number | null
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
 * exactly one event. With `beta.keepInactiveToolsMounted`, a tool that is
 * shown again from a hidden `<Activity>` boundary is not remounted, but
 * React re-creates its effects on reveal, so each activation still logs
 * exactly one event (`isFirstMount: false`).
 */
export function ToolMountTimer({toolName, t0}: ToolMountTimerProps): null {
  const telemetry = useTelemetry()

  useEffect(() => {
    if (t0 === null) return
    const isFirstMount = !mountedTools.has(toolName)
    mountedTools.add(toolName)
    telemetry.log(StudioToolMountTimeMeasured, {
      toolName,
      durationMs: performance.now() - t0,
      isFirstMount,
    })
    // Intentionally mount-only / reveal-only: we want exactly one event per
    // activation. The parent re-keys per tool when tools unmount; with
    // keepInactiveToolsMounted, Activity re-creates this effect on reveal.
  }, [telemetry, toolName, t0])

  return null
}
