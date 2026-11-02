import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useVariantsMode} from '../contexts/mode/useVariantsMode'
import {variants} from './index'

vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))

const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)

const VariantsStudioProvider = variants().studio!.components!.provider!

function Mode() {
  return <span>mode:{String(use(useVariantsMode()))}</span>
}

function Probe() {
  return (
    <Suspense fallback={<span>mode:pending</span>}>
      <Mode />
    </Suspense>
  )
}

async function renderProvider(features: Partial<SettledFeatures>) {
  useFeatureEnabledObservableMock.mockReturnValue(
    of({enabled: false, features: [], error: null, ...features}),
  )
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(<VariantsStudioProvider renderDefault={() => <Probe />}>{null}</VariantsStudioProvider>)
  })
}

describe('VariantsStudioProvider', () => {
  it('checks the content variants feature', async () => {
    await renderProvider({enabled: true})

    expect(useFeatureEnabledObservableMock).toHaveBeenCalledWith('contentVariants')
  })

  it('settles the default mode when the plan has content variants', async () => {
    await renderProvider({enabled: true})

    expect(await screen.findByText('mode:default')).toBeInTheDocument()
  })

  it('settles the upsell mode when the plan lacks content variants', async () => {
    await renderProvider({enabled: false})

    expect(await screen.findByText('mode:upsell')).toBeInTheDocument()
  })

  it('settles no mode when the feature check fails', async () => {
    await renderProvider({enabled: false, error: new Error('Something went wrong')})

    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })

  it('throws from the mode hook without the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useVariantsMode)).toThrow('VariantsModePromise: missing context value')

    consoleError.mockRestore()
  })
})
