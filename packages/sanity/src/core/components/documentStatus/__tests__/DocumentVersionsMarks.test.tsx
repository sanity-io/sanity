import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {DocumentVersionsMarks} from '../DocumentVersionsMarks'

describe('DocumentVersionsMarks', () => {
  it.each([
    [1, '1 version'],
    [3, '3 versions'],
  ])('names %i versions as "%s" for assistive technology', async (count, label) => {
    const wrapper = await createTestProvider()
    render(
      <DocumentVersionsMarks versionCount={count}>
        <span data-testid="mark" />
      </DocumentVersionsMarks>,
      {wrapper},
    )
    const group = screen.getByRole('group', {name: label})
    expect(group).toContainElement(screen.getByTestId('mark'))
  })
})
