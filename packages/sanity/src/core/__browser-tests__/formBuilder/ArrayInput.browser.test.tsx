import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import ArrayInputStory from './ArrayInputStory'

describe('Tag layout', () => {
  it('Pressing enter should create inline tags', async () => {
    const {typeWithDelay} = testHelpers()
    render(<ArrayInputStory />)
    const $field = page.getByTestId('field-tags')
    await expect.element($field).toBeVisible()
    const textbox = $field.getByRole('textbox')
    await textbox.element().focus()

    await typeWithDelay('abc')
    await userEvent.keyboard('{Enter}')
    await typeWithDelay('123')
    await userEvent.keyboard('{Enter}')

    // Check tags are created
    await expect.element(page.getByText('abc')).toBeVisible()
    await expect.element(page.getByText('123')).toBeVisible()
  })
})
