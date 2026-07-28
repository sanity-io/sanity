import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {DeleteVariantDialog} from '../DeleteVariantDialog'

describe('DeleteVariantDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDialog = async (props?: Partial<Parameters<typeof DeleteVariantDialog>[0]>) => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })

    render(
      <DeleteVariantDialog
        isDeleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
        variantTitle="Alpha audience"
        {...props}
      />,
      {wrapper},
    )

    await screen.findByTestId('delete-variant-dialog')

    return {onClose, onConfirm}
  }

  it('renders the confirmation dialog with the variant title', async () => {
    await renderDialog()

    expect(
      screen.getByRole('dialog', {
        name: 'Are you sure you want to delete this variant definition?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'This will permanently delete "Alpha audience". This action cannot be undone.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).toHaveTextContent('Yes, delete variant definition')
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup()
    const {onConfirm} = await renderDialog()

    await user.click(screen.getByTestId('confirm-button'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const {onClose} = await renderDialog()

    await user.click(screen.getByTestId('cancel-button'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables confirm and hides cancel while deleting', async () => {
    await renderDialog({isDeleting: true})

    expect(screen.getByTestId('confirm-button')).toBeDisabled()
    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument()
  })
})
