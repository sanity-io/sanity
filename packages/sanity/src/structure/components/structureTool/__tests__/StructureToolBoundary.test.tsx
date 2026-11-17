import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {defineConfig, type Tool} from 'sanity'
import {expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type StructureResolver, type StructureToolOptions} from '../../../types'
import {StructureToolBoundary} from '../StructureToolBoundary'

it('reloads only the structure tool after a structure error', async () => {
  let attempts = 0
  const structure: StructureResolver = (S) => () => {
    attempts += 1
    if (attempts === 1) throw new Error('Structure failed')

    return S.list().id('root').title('Recovered content').items([])
  }
  const tool: Tool<StructureToolOptions> = {
    name: 'structure',
    title: 'Structure',
    component: () => null,
    options: {structure},
  }
  const TestProvider = await createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test'}),
    resources: [structureUsEnglishLocaleBundle],
  })

  render(
    <TestProvider>
      <StructureToolBoundary tool={tool} />
    </TestProvider>,
  )
  expect(await screen.findByText('Encountered an error while reading structure')).toBeVisible()

  await userEvent.click(screen.getByRole('button', {name: 'Reload'}))

  expect(await screen.findByText('Recovered content')).toBeInTheDocument()
  expect(screen.queryByText('Encountered an error while reading structure')).toBeNull()
})
