import {render, waitFor} from '@testing-library/react'
import {type MutableRefObject} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type {StudioToolMountTimeMeasured as StudioToolMountTimeMeasuredType} from '../__telemetry__/tools.telemetry'
import type {ToolMountTimer as ToolMountTimerType} from '../ToolMountTimer'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(),
}))

function makeRef<T>(value: T): MutableRefObject<T> {
  return {current: value}
}

describe('ToolMountTimer', () => {
  let telemetryLog: ReturnType<typeof vi.fn>
  let ToolMountTimer: typeof ToolMountTimerType
  let StudioToolMountTimeMeasured: typeof StudioToolMountTimeMeasuredType

  beforeEach(async () => {
    // Reset the module graph so the module-level `mountedTools` Set
    // starts fresh each test.
    vi.resetModules()

    telemetryLog = vi.fn()

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: telemetryLog})
    ;({ToolMountTimer} = await import('../ToolMountTimer'))
    ;({StudioToolMountTimeMeasured} = await import('../__telemetry__/tools.telemetry'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fires Studio Tool Mount Time Measured on mount with isFirstMount=true', async () => {
    const t0Ref = makeRef<number | null>(performance.now())
    render(<ToolMountTimer toolName="structure" t0Ref={t0Ref} />)

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioToolMountTimeMeasured,
      expect.objectContaining({
        toolName: 'structure',
        isFirstMount: true,
        durationMs: expect.any(Number),
      }),
    )
    expect(telemetryLog.mock.calls[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('reports isFirstMount=false on a second mount of the same tool', async () => {
    const {unmount} = render(
      <ToolMountTimer toolName="structure" t0Ref={makeRef<number | null>(performance.now())} />,
    )

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    expect(telemetryLog.mock.calls[0][1]).toMatchObject({
      toolName: 'structure',
      isFirstMount: true,
    })

    unmount()

    // Second mount of the same tool — should log with isFirstMount=false
    render(
      <ToolMountTimer toolName="structure" t0Ref={makeRef<number | null>(performance.now())} />,
    )

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(2)
    })

    expect(telemetryLog.mock.calls[1][1]).toMatchObject({
      toolName: 'structure',
      isFirstMount: false,
    })
  })

  it('reports isFirstMount=true for each distinct tool', async () => {
    const {unmount} = render(
      <ToolMountTimer toolName="structure" t0Ref={makeRef<number | null>(performance.now())} />,
    )
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })
    unmount()

    render(<ToolMountTimer toolName="vision" t0Ref={makeRef<number | null>(performance.now())} />)
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(2)
    })

    expect(telemetryLog.mock.calls[0][1]).toMatchObject({
      toolName: 'structure',
      isFirstMount: true,
    })
    expect(telemetryLog.mock.calls[1][1]).toMatchObject({
      toolName: 'vision',
      isFirstMount: true,
    })
  })

  it('measures durationMs as the delta from the provided t0', async () => {
    // Set t0 to 42ms ago.
    const t0Ref = makeRef<number | null>(performance.now() - 42)
    render(<ToolMountTimer toolName="structure" t0Ref={t0Ref} />)

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    const {durationMs} = telemetryLog.mock.calls[0][1] as {durationMs: number}
    // Allow a wide band — the test just proves it's a sensible delta
    // from t0, not an absolute performance.now() value.
    expect(durationMs).toBeGreaterThanOrEqual(42)
    expect(durationMs).toBeLessThan(5_000)
  })

  it('does not fire when t0Ref.current is null (parent has not yet set it)', async () => {
    const t0Ref = makeRef<number | null>(null)
    render(<ToolMountTimer toolName="structure" t0Ref={t0Ref} />)

    // Give the effect a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(telemetryLog).not.toHaveBeenCalled()
  })

  it('renders nothing', () => {
    const {container} = render(
      <ToolMountTimer toolName="structure" t0Ref={makeRef<number | null>(performance.now())} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
