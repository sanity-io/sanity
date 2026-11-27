import {render, screen} from '@testing-library/react'
import {describe, expect, type Mock, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {useStructureToolSetting} from '../../../useStructureToolSetting'
import {useDocumentPane} from '../useDocumentPane'
import {InspectDialog} from './InspectDialog'

vi.mock('../../../useStructureToolSetting', () => ({
  useStructureToolSetting: vi.fn(),
}))
vi.mock('../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const mockUseStructureToolSetting = useStructureToolSetting as Mock<typeof useStructureToolSetting>
const mockUseDocumentPane = useDocumentPane as Mock

async function renderDialog(storedViewMode: string) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  mockUseStructureToolSetting.mockReturnValue([storedViewMode, vi.fn()])
  mockUseDocumentPane.mockReturnValue({onInspectClose: vi.fn(), paneKey: 'test-pane'})

  render(<InspectDialog value={{_id: 'doc', _type: 'author', name: 'A name'}} />, {wrapper})
}

function findTab(name: 'Parsed' | 'Raw JSON') {
  return screen.findByRole('tab', {name, hidden: true})
}

describe('InspectDialog', () => {
  test('shows the stored view mode', async () => {
    await renderDialog('raw')

    expect(await findTab('Raw JSON')).toHaveAttribute('aria-selected', 'true')
    expect(await findTab('Parsed')).toHaveAttribute('aria-selected', 'false')
  })

  test('falls back to the parsed view for an unknown stored view mode', async () => {
    await renderDialog('not-a-view-mode')

    expect(await findTab('Parsed')).toHaveAttribute('aria-selected', 'true')
    expect(await findTab('Raw JSON')).toHaveAttribute('aria-selected', 'false')
  })
})
