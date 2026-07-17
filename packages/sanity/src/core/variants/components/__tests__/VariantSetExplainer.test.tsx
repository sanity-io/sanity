import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VariantSetExplainer} from '../VariantSetExplainer'

const STORAGE_KEY = 'sanity-studio.variants.set-explainer.dismissed'

describe('VariantSetExplainer', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  const renderExplainer = async () => {
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    return render(<VariantSetExplainer />, {wrapper})
  }

  it('renders the explainer by default', async () => {
    await renderExplainer()
    expect(await screen.findByTestId('variant-set-explainer')).toBeInTheDocument()
    expect(screen.getByText('How variant sets work')).toBeInTheDocument()
  })

  it('dismisses and persists the choice to localStorage', async () => {
    const user = userEvent.setup()
    await renderExplainer()

    await user.click(await screen.findByTestId('variant-set-explainer-dismiss'))

    expect(screen.queryByTestId('variant-set-explainer')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('stays hidden when already dismissed', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    await renderExplainer()

    await waitFor(() => {
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('variant-set-explainer')).not.toBeInTheDocument()
  })
})
