import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FieldGroupTabs} from './FieldGroupTabs'

const groups = [
  {
    name: 'content',
    title: 'Content',
    selected: true,
    fields: [],
  },
  {
    name: 'settings',
    title: 'Settings',
    fields: [],
  },
]

describe('FieldGroupTabs', () => {
  it('shows tabs on larger screens', async () => {
    await render(
      <TestWrapper schemaTypes={[]}>
        <FieldGroupTabs groups={groups} path={[]} shouldAutoFocus={false} />
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('field-group-tabs')).toBeVisible()
    await expect.element(page.getByTestId('field-group-select')).not.toBeVisible()
  })

  it('shows the select on small screens', async () => {
    await page.viewport(320, 900)
    await render(
      <TestWrapper schemaTypes={[]}>
        <FieldGroupTabs groups={groups} path={[]} shouldAutoFocus={false} />
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('field-group-tabs')).not.toBeVisible()
    await expect.element(page.getByTestId('field-group-select')).toBeVisible()
  })
})
