import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {VersionModeHeader} from '../VersionModeHeader'

vi.mock('../../../hooks/useDiffViewState', () => ({
  useDiffViewState: () => ({
    isActive: true,
    state: 'ready',
    mode: 'version',
    documents: {
      previous: {type: 'author', id: 'doc-1'},
      next: {type: 'author', id: 'drafts.doc-1'},
    },
  }),
}))

vi.mock('../../../hooks/useDiffViewRouter', () => ({
  useDiffViewRouter: () => ({exitDiffView: vi.fn(), navigateDiffView: vi.fn()}),
}))

async function renderHeader(variantsEnabled: boolean) {
  const wrapper = await createTestProvider({
    config: variantsEnabled ? {beta: {variants: {enabled: true}}} : undefined,
    resources: [structureUsEnglishLocaleBundle],
  })
  render(<VersionModeHeader documentId="doc-1" state="ready" />, {wrapper})
}

describe('VersionModeHeader', () => {
  it("renders main's header with Variants off: its title and no side labels", async () => {
    await renderHeader(false)

    expect(await screen.findByRole('heading', {name: 'Compare versions'})).toBeInTheDocument()
    expect(screen.queryByTestId('diff-view-side-label-previous')).not.toBeInTheDocument()
    expect(screen.queryByTestId('diff-view-side-label-next')).not.toBeInTheDocument()
  })

  it('names the sides with Variants on', async () => {
    await renderHeader(true)

    expect(await screen.findByRole('heading', {name: 'Comparison view'})).toBeInTheDocument()
    expect(screen.getByTestId('diff-view-side-label-previous')).toHaveTextContent('Reference')
    expect(screen.getByTestId('diff-view-side-label-next')).toHaveTextContent('Comparing with')
  })
})
