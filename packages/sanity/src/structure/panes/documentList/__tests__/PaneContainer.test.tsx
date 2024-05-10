import {describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'
import {defineConfig} from 'sanity'
import {type DocumentListPaneNode, type StructureToolContextValue} from 'sanity/structure'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {useStructureToolSetting} from '../../../useStructureToolSetting'
import {PaneContainer} from '../PaneContainer'

jest.mock('../../../useStructureToolSetting', () => ({
  useStructureToolSetting: jest.fn(),
}))

jest.mock('../../../useStructureTool', () => ({
  useStructureTool: jest.fn().mockReturnValue({features: {}} as StructureToolContextValue),
}))
jest.mock('../../../components/pane/usePaneLayout', () => ({
  usePaneLayout: jest.fn().mockReturnValue({panes: [], mount: jest.fn()}),
}))

const mockUseStructureToolSetting = useStructureToolSetting as jest.Mock<
  typeof useStructureToolSetting
>

describe('PaneContainer', () => {
  it('should show the document list pane when a list layout is selected', async () => {
    const config = defineConfig({
      projectId: 'test',
      dataset: 'test',
    })

    const wrapper = await createTestProvider({
      config,
      resources: [structureUsEnglishLocaleBundle],
    })
    mockUseStructureToolSetting.mockReturnValue(['compact', jest.fn()])
    render(
      <PaneContainer
        paneKey="paneKey"
        index={1}
        itemId="123"
        pane={{options: {}} as DocumentListPaneNode}
      />,
      {wrapper},
    )

    screen.getByTestId('document-list-pane')
    expect(screen.queryByTestId('document-sheet-list-pane')).toBeNull()
  })

  it('should show the document sheet list pane when the sheet layout is selected', async () => {
    const config = defineConfig({
      projectId: 'test',
      dataset: 'test',
    })

    const wrapper = await createTestProvider({
      config,
      resources: [structureUsEnglishLocaleBundle],
    })
    mockUseStructureToolSetting.mockReturnValue(['sheetList', jest.fn()])
    render(
      <PaneContainer
        paneKey="paneKey"
        index={1}
        itemId="123"
        pane={{options: {}} as DocumentListPaneNode}
      />,
      {wrapper},
    )

    screen.getByTestId('document-sheet-list-pane')
    expect(screen.queryByTestId('document-list-pane')).toBeNull()
  })
})
