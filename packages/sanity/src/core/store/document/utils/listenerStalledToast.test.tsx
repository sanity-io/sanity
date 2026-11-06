import {useToast} from '@sanity/ui/toast'
import {act, renderHook, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getListenerStalledToastParams, LISTENER_STALLED_TOAST_ID} from './listenerStalledToast'

async function renderStallToast() {
  const wrapper = await createTestProvider()
  const {result} = renderHook(
    () => {
      const toast = useToast()
      const {t} = useTranslation()
      return {toast, t}
    },
    {wrapper},
  )
  return result
}

describe('getListenerStalledToastParams', () => {
  it('describes a warning with the approved copy and a stable id', async () => {
    const result = await renderStallToast()

    expect(getListenerStalledToastParams(result.current.t)).toEqual({
      id: LISTENER_STALLED_TOAST_ID,
      status: 'warning',
      closable: true,
      duration: 15_000,
      title: 'This document was out of date',
      description:
        'It has been reloaded with the latest version. Edits you made to content someone else removed may not have saved.',
    })
  })

  it('renders a single toast when pushed twice', async () => {
    const result = await renderStallToast()

    act(() => {
      result.current.toast.push(getListenerStalledToastParams(result.current.t))
      result.current.toast.push(getListenerStalledToastParams(result.current.t))
    })

    expect(await screen.findAllByText('This document was out of date')).toHaveLength(1)
  })
})
