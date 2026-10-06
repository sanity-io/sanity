import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {CommentsEnabledContext, CommentsModePromiseContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type CommentsMode} from '../../context/enabled/types'
import {useCommentsEnabled} from '../useCommentsEnabled'
import {useCommentsMode} from '../useCommentsMode'

function ModeProbe() {
  // The leaf that renders differently per mode reads the promise with `use()`
  const mode = use(useCommentsMode())
  return <span>{`mode:${String(mode)}`}</span>
}

async function renderMode(modePromise: Promise<CommentsMode>) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <CommentsModePromiseContext value={modePromise}>
        <Suspense fallback={<span>pending</span>}>
          <ModeProbe />
        </Suspense>
      </CommentsModePromiseContext>,
    )
  })
}

describe('useCommentsEnabled', () => {
  it('reads as disabled without any provider, as a form outside the studio renders', () => {
    // The plugin's field middleware renders in every form, including forms mounted by test
    // harnesses that do not render the studio.components.provider chain
    const {result} = renderHook(useCommentsEnabled)

    expect(result.current).toBe(false)
  })

  it('reads the config decision synchronously, without the plugin provider', () => {
    // Whether comments are enabled does not depend on the plan, so it never waits for the check
    const {result} = renderHook(useCommentsEnabled, {
      wrapper: ({children}) => <CommentsEnabledContext value>{children}</CommentsEnabledContext>,
    })

    expect(result.current).toBe(true)
  })
})

describe('useCommentsMode', () => {
  it('throws when the plugin provider is missing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useCommentsMode)).toThrow('CommentsModePromise: missing context value')

    consoleError.mockRestore()
  })

  it('hands out the provider promise itself, so it can be awaited in an event handler', () => {
    const modePromise = Promise.resolve<CommentsMode>('default')
    const {result} = renderHook(useCommentsMode, {
      wrapper: ({children}) => (
        <CommentsModePromiseContext value={modePromise}>{children}</CommentsModePromiseContext>
      ),
    })

    expect(result.current).toBe(modePromise)
  })

  it('suspends a leaf reading it until the check has answered, then renders the mode', async () => {
    let settle!: (mode: CommentsMode) => void
    const modePromise = new Promise<CommentsMode>((resolve) => {
      settle = resolve
    })
    await renderMode(modePromise)

    expect(screen.getByText('pending')).toBeInTheDocument()

    await act(async () => settle('upsell'))

    expect(await screen.findByText('mode:upsell')).toBeInTheDocument()
  })

  it('renders null for a failed check, so leaves fail closed', async () => {
    await renderMode(Promise.resolve<CommentsMode>(null))

    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })
})
