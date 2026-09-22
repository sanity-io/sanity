/**
 * Temporary debug-mode logger for Storybook/browser harnesses.
 * Posts NDJSON to the host collector (writes /opt/cursor/logs/debug.log).
 */
export function agentDebugLog(payload: {
  hypothesisId: string
  location: string
  message: string
  data?: Record<string, unknown>
}): void {
  // #region agent log
  const body = JSON.stringify({...payload, timestamp: Date.now(), data: payload.data ?? {}})
  try {
    void fetch('http://127.0.0.1:7399/log', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body,
      mode: 'cors',
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // ignore
  }
  // #endregion
}
