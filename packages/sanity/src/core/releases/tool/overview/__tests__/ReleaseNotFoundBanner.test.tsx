import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseNotFoundBanner} from '../ReleaseNotFoundBanner'

describe('ReleaseNotFoundBanner', () => {
  it('should render the not found message', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<ReleaseNotFoundBanner onDismiss={vi.fn()} />, {wrapper})

    expect(await screen.findByText('This release could not be found')).toBeInTheDocument()
  })

  it('should call onDismiss when close button is clicked', async () => {
    const onDismiss = vi.fn()
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<ReleaseNotFoundBanner onDismiss={onDismiss} />, {wrapper})

    await screen.findByText('This release could not be found')
    await userEvent.click(screen.getByRole('button'))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
