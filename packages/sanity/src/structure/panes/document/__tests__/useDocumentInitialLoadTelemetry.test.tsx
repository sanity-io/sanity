import {render, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(),
}))

// The hook imports `EditStateFor` as a type only, but `from 'sanity'`
// pulls in the whole barrel at runtime. Stub it with a minimal shape
// so we don't pull in the entire Studio tree into this test.
vi.mock('sanity', () => ({}))

describe('useDocumentInitialLoadTelemetry', () => {
  let telemetryLog: ReturnType<typeof vi.fn>
  let useDocumentInitialLoadTelemetry: typeof import('../useDocumentInitialLoadTelemetry').useDocumentInitialLoadTelemetry
  let DocumentInitialLoadMeasured: typeof import('../__telemetry__/documentInitialLoad.telemetry').DocumentInitialLoadMeasured

  beforeEach(async () => {
    vi.resetModules()
    telemetryLog = vi.fn()

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: telemetryLog})
    ;({useDocumentInitialLoadTelemetry} = await import('../useDocumentInitialLoadTelemetry'))
    ;({DocumentInitialLoadMeasured} = await import(
      '../__telemetry__/documentInitialLoad.telemetry'
    ))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  type HookProps = Parameters<typeof useDocumentInitialLoadTelemetry>[0]

  function Harness(props: HookProps): null {
    useDocumentInitialLoadTelemetry(props)
    return null
  }

  const defaultEditState = {
    ready: true,
    draft: null,
    published: {_id: 'abc', _type: 'post'} as never,
    version: null,
  }

  it('does not fire while ready is false', async () => {
    render(
      <Harness
        ready={false}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(telemetryLog).not.toHaveBeenCalled()
  })

  it('fires Document Initial Load Measured when ready transitions to true', async () => {
    const {rerender} = render(
      <Harness
        ready={false}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    expect(telemetryLog).not.toHaveBeenCalled()

    rerender(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })
    expect(telemetryLog).toHaveBeenCalledWith(
      DocumentInitialLoadMeasured,
      expect.objectContaining({
        documentTypeName: 'post',
        isNewDocument: false,
        hasRevisionParam: false,
        durationMs: expect.any(Number),
      }),
    )
    expect(telemetryLog.mock.calls[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('reports isNewDocument=true when editState has no draft, published, or version', async () => {
    render(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={{ready: true, draft: null, published: null, version: null}}
        hasRevisionParam={false}
      />,
    )
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })
    expect(telemetryLog.mock.calls[0][1]).toMatchObject({isNewDocument: true})
  })

  it('reports hasRevisionParam=true when passed through', async () => {
    render(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={true}
      />,
    )
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })
    expect(telemetryLog.mock.calls[0][1]).toMatchObject({hasRevisionParam: true})
  })

  it('falls back to documentTypeName="unknown" when schema is not resolved', async () => {
    render(
      <Harness
        ready={true}
        schemaTypeName={undefined}
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })
    expect(telemetryLog.mock.calls[0][1]).toMatchObject({documentTypeName: 'unknown'})
  })

  it('fires only once across re-renders after ready', async () => {
    const {rerender} = render(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    // Re-render with same props → no refire.
    rerender(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    // Re-render flipping ready back and forth → still no refire.
    rerender(
      <Harness
        ready={false}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )
    rerender(
      <Harness
        ready={true}
        schemaTypeName="post"
        editState={defaultEditState}
        hasRevisionParam={false}
      />,
    )

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(telemetryLog).toHaveBeenCalledTimes(1)
  })
})
