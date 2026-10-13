import {render, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useCommentsMode} from '../hooks/useCommentsMode'
import {comments} from './index'

vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))

const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)

const CommentsStudioProvider = comments().studio!.components!.provider!

function Mode() {
  // The leaf that renders differently per mode reads the promise with `use()`
  return <span>mode:{String(use(useCommentsMode()))}</span>
}

function Probe() {
  return (
    <Suspense fallback={<span>mode:pending</span>}>
      <Mode />
    </Suspense>
  )
}

const laterFallbackRendered = vi.fn()
function LaterFallback() {
  laterFallbackRendered()
  return <span>later:pending</span>
}
function Later() {
  return <span>later:{String(use(useCommentsMode()))}</span>
}

async function renderProvider(features: Partial<SettledFeatures>) {
  useFeatureEnabledObservableMock.mockReturnValue(
    of({enabled: false, features: [], error: null, ...features}),
  )
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(<CommentsStudioProvider renderDefault={() => <Probe />}>{null}</CommentsStudioProvider>)
  })
}

describe('CommentsStudioProvider', () => {
  it('settles the default mode once the feature check answers', async () => {
    await renderProvider({enabled: true})

    expect(await screen.findByText('mode:default')).toBeInTheDocument()
  })

  it('settles the upsell mode when the plan lacks the feature', async () => {
    await renderProvider({enabled: false})

    expect(await screen.findByText('mode:upsell')).toBeInTheDocument()
  })

  it('settles no mode when the feature check fails', async () => {
    await renderProvider({enabled: false, error: new Error('Something went wrong')})

    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })

  it('settles the mode in place, so a leaf that mounts later reads it without suspending', async () => {
    useFeatureEnabledObservableMock.mockReturnValue(of({enabled: true, features: [], error: null}))
    // Nothing reads the mode while the check answers (fields and the document layout only check
    // whether comments are enabled, which is a config decision)
    const {rerender} = render(
      <CommentsStudioProvider renderDefault={() => <span>no leaf</span>}>
        {null}
      </CommentsStudioProvider>,
    )
    await act(() => Promise.resolve())

    // The inspector and the upsell dialog mount long after the check answered; the promise the
    // context carries is the one that settled, so `use()` reads it synchronously
    rerender(
      <CommentsStudioProvider
        renderDefault={() => (
          <Suspense fallback={<LaterFallback />}>
            <Later />
          </Suspense>
        )}
      >
        {null}
      </CommentsStudioProvider>,
    )

    expect(screen.getByText('later:default')).toBeInTheDocument()
    expect(laterFallbackRendered).not.toHaveBeenCalled()
  })
})
