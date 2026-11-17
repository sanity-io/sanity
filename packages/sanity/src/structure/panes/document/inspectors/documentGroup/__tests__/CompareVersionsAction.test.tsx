import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {test as baseTest, describe, expect, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {CompareVersionsAction} from '../CompareVersionsAction'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>

function buildDocumentPaneValue({
  hasDraft,
  onMenuAction,
}: {
  hasDraft: boolean
  onMenuAction: DocumentPaneContextValue['onMenuAction']
}): DocumentPaneContextValue {
  const draft = hasDraft ? {_id: 'drafts.doc-123', _type: 'author'} : null
  const published = {_id: 'doc-123', _type: 'author'}

  return {
    documentId: 'doc-123',
    displayed: draft ?? published,
    editState: {
      id: 'doc-123',
      type: 'author',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
      ready: true,
      draft,
      published,
      version: null,
    },
    onMenuAction,
  } as DocumentPaneContextValue
}

const test = baseTest
  .extend('TestProvider', {scope: 'file'}, () =>
    createTestProvider({resources: [structureUsEnglishLocaleBundle]}),
  )
  .extend('hasDraft', () => true)
  .extend('renderAction', ({TestProvider, hasDraft}) => {
    const onMenuAction = vi.fn<DocumentPaneContextValue['onMenuAction']>()
    mockUseDocumentPane.mockReturnValue(buildDocumentPaneValue({hasDraft, onMenuAction}))

    return async () => {
      render(<CompareVersionsAction />, {wrapper: TestProvider})

      // The test provider renders a spinner until the locale resources have loaded.
      const button = await screen.findByRole('button', {name: 'Compare versions'})

      return {button, onMenuAction}
    }
  })

describe('CompareVersionsAction', () => {
  test('dispatches the pane menu item that opens the comparison', async ({renderAction}) => {
    const {button, onMenuAction} = await renderAction()

    expect(button).toBeEnabled()
    await userEvent.click(button)

    expect(onMenuAction).toHaveBeenCalledTimes(1)
    expect(onMenuAction).toHaveBeenCalledWith(
      expect.objectContaining({action: 'compareVersions', title: 'Compare versions'}),
    )
  })

  describe('when the displayed version has no earlier version to compare with', () => {
    test.override('hasDraft', () => false)

    test('is disabled', async ({renderAction}) => {
      const {button, onMenuAction} = await renderAction()

      expect(button).toBeDisabled()
      await userEvent.click(button)
      expect(onMenuAction).not.toHaveBeenCalled()
    })
  })
})
