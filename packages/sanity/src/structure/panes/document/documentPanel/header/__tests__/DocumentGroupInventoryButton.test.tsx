import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type DocumentInspector} from 'sanity'
import {test as baseTest, describe, expect, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../constants'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryButton} from '../DocumentGroupInventoryButton'

vi.mock('../../../useDocumentPane')

// Typed as a partial so every field below is checked against the real context, without
// having to build the ~40 fields the button never reads.
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>

const documentGroupInspector: DocumentInspector = {
  name: DOCUMENT_GROUP_INSPECTOR_NAME,
  component: () => null,
}

const test = baseTest
  .extend('wrapper', {scope: 'file'}, () =>
    createTestProvider({resources: [structureUsEnglishLocaleBundle]}),
  )
  .extend('openInspector', () => vi.fn())
  .extend('closeInspector', () => vi.fn())
  .extend('documentPaneOverrides', (): Partial<DocumentPaneContextValue> => ({}))
  .extend('renderButton', ({wrapper, openInspector, closeInspector, documentPaneOverrides}) => {
    mockUseDocumentPane.mockReturnValue({
      inspector: null,
      openInspector,
      closeInspector,
      ...documentPaneOverrides,
    })

    return () => render(<DocumentGroupInventoryButton />, {wrapper})
  })

describe('DocumentGroupInventoryButton', () => {
  test('opens the document group inspector', async ({
    renderButton,
    openInspector,
    closeInspector,
  }) => {
    renderButton()

    const button = await screen.findByRole('button', {name: 'Manage versions'})
    expect(button).not.toHaveAttribute('data-selected')

    await userEvent.click(button)

    expect(openInspector).toHaveBeenCalledWith(DOCUMENT_GROUP_INSPECTOR_NAME)
    expect(closeInspector).not.toHaveBeenCalled()
  })

  describe('when the document group inspector is open', () => {
    test.override('documentPaneOverrides', () => ({inspector: documentGroupInspector}))

    test('closes the document group inspector when it is open', async ({
      renderButton,
      openInspector,
      closeInspector,
    }) => {
      renderButton()

      const button = await screen.findByRole('button', {name: 'Manage versions'})
      expect(button).toHaveAttribute('data-selected', '')

      await userEvent.click(button)

      expect(closeInspector).toHaveBeenCalledWith(DOCUMENT_GROUP_INSPECTOR_NAME)
      expect(openInspector).not.toHaveBeenCalled()
    })
  })
})
