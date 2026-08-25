import {render} from '@testing-library/react'
import {expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type DivergenceNavigator, type ReachableDivergence} from '../divergenceNavigator'
import {type Divergence} from '../readDocumentDivergences'
import {DivergenceIndicator} from './DivergenceIndicator'

const baseDivergence: Divergence = {
  path: 'title',
  effect: 'set',
  documentId: 'upstream-doc',
  documentType: 'article',
  subjectId: 'drafts.doc-1',
  sinceRevisionId: 'upstream-doc@rev-1',
  isAddressable: true,
  status: 'unresolved',
  snapshots: {
    subjectHead: undefined,
    upstreamHead: undefined,
    upstreamAtFork: undefined,
  },
}

const divergence: ReachableDivergence = {
  ...baseDivergence,
  isComposite: false,
  divergences: [['title', baseDivergence]],
  schemaType: {name: 'string', jsonType: 'string'},
}

const divergenceNavigator: DivergenceNavigator = {
  focusDivergence: vi.fn(),
  blurDivergence: vi.fn(),
  blurFocusedDivergence: vi.fn(),
  state: {
    focusedDivergence: undefined,
    previousDivergence: undefined,
    nextDivergence: undefined,
    state: 'ready',
    upstreamId: 'upstream-doc',
    allDivergences: [['title', baseDivergence]],
    divergences: [['title', divergence]],
    divergencesByNode: {title: 1},
  },
}

test('does not forward the styling path to the DOM', async () => {
  const TestProvider = await createTestProvider()
  const {container} = render(
    <TestProvider>
      <DivergenceIndicator
        divergence={divergence}
        divergenceNavigator={divergenceNavigator}
        upstreamBundle="published"
      />
    </TestProvider>,
  )

  const renderedElements = container.querySelectorAll('*')
  expect(renderedElements.length).toBeGreaterThan(0)

  for (const element of renderedElements) {
    expect(element).not.toHaveAttribute('path')
    expect(element).not.toHaveAttribute('$path')
  }
})
