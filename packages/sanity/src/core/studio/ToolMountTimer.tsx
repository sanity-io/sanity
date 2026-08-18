import {useTelemetry} from '@sanity/telemetry/react'
import {type RefObject, useEffect} from 'react'

import {StudioToolMountTimeMeasured} from './__telemetry__/tools.telemetry'

// Module-level record of which tools have already mounted in this page
// session. Survives tool switches but is cleared by a hard reload/HMR.
// Using a `Set` means the check + update are cheap and the value for
// `isFirstMount` is deterministic even across StrictMode double-mount.
const mountedTools = new Set<string>()

interface ToolMountTimerProps {
  toolName: string
  /**
   * Ref holding the ms-since-navigation-start timestamp captured when this
   * tool was selected. The parent sets this in an effect when `activeToolName`
   * changes; we read it in our own effect (after Suspense resolves and the
   * tool's first commit lands), avoiding impure reads during render.
   */
  t0Ref: RefObject<number | null>
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
export function ToolMountTimer({toolName, t0Ref}: ToolMountTimerProps): null {
  const telemetry = useTelemetry()

  useEffect(() => {
    const t0 = t0Ref.current
    if (t0 === null) return
    const isFirstMount = !mountedTools.has(toolName)
    mountedTools.add(toolName)
    telemetry.log(StudioToolMountTimeMeasured, {
      toolName,
      durationMs: performance.now() - t0,
      isFirstMount,
    })
    // Intentionally mount-only: we want exactly one event per mount of
    // this component, and the parent re-keys per tool activation.
  }, [telemetry, toolName, t0Ref])

  return null
}
