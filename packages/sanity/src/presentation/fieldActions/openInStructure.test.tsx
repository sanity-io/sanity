import {defineType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {createSchema} from '../../core/schema/createSchema'
import {useUnique} from '../../core/util/useUnique'
import {openInStructure} from './openInStructure'

const path = ['title']
const schemaType = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'page',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    }),
  ],
}).get('page')!

function ActionProbe({tick}: {tick: number}) {
  const action = openInStructure.useAction({
    documentId: 'page-1',
    documentType: 'page',
    path,
    schemaType,
  })
  // oxlint-disable-next-line no-deprecated -- FieldActionsResolver stores the node with useUnique
  useUnique(action)

  return <span data-testid="action-title">{`${tick}:${action.title}`}</span>
}

describe('openInStructure', () => {
  it('settles when the document pane re-renders while the preview iframe loads', async () => {
    const TestProvider = await createTestProvider()

    function Pane({tick}: {tick: number}) {
      return (
        <TestProvider>
          <ActionProbe tick={tick} />
        </TestProvider>
      )
    }

    const {rerender} = render(<Pane tick={0} />)
    expect(screen.getByTestId('action-title')).toHaveTextContent('0:Open in Structure')

    // A router update from the loading iframe re-renders the field action. An inline
    // `onAction` makes `useUnique` set state until React throws #301.
    rerender(<Pane tick={1} />)
    expect(screen.getByTestId('action-title')).toHaveTextContent('1:Open in Structure')
  })
})
