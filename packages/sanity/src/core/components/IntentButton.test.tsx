import {AddIcon} from '@sanity/icons/Add'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {IntentButton} from './IntentButton'

const INTENT_PROPS = {
  intent: 'create',
  params: {type: 'author', template: 'author'},
  replace: true,
  searchParams: [['perspective', 'rXYZ']] as [string, string][],
}

const INTENT_ONLY_ATTRIBUTES = ['intent', 'params', 'replace', 'searchParams', 'searchparams']

describe('IntentButton', () => {
  it('does not forward intent props to the DOM while disabled', async () => {
    const wrapper = await createTestProvider()

    render(
      <IntentButton
        {...INTENT_PROPS}
        aria-label="Create author"
        data-testid="action-intent-button"
        disabled
        icon={AddIcon}
        tooltipProps={null}
      />,
      {wrapper},
    )

    const button = screen.getByTestId('action-intent-button')

    expect(button.tagName).toBe('A')
    expect(button).toHaveAttribute('role', 'link')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    for (const attribute of INTENT_ONLY_ATTRIBUTES) {
      expect(button).not.toHaveAttribute(attribute)
    }
  })

  it('resolves the intent link when enabled without leaking intent props to the DOM', async () => {
    const wrapper = await createTestProvider()

    render(
      <IntentButton
        {...INTENT_PROPS}
        aria-label="Create author"
        data-testid="action-intent-button"
        icon={AddIcon}
        tooltipProps={null}
      />,
      {wrapper},
    )

    const link = screen.getByTestId('action-intent-button')

    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', expect.stringContaining('/intent/create/'))
    expect(link.getAttribute('href')).toContain('type=author')
    expect(link.getAttribute('href')).toContain('perspective=rXYZ')
    for (const attribute of INTENT_ONLY_ATTRIBUTES) {
      expect(link).not.toHaveAttribute(attribute)
    }
  })
})
