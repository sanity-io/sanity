import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {DetailPropertiesPanel} from '../DetailPropertiesPanel'

describe('DetailPropertiesPanel', () => {
  it('renders only its sections when no footer is passed, as the Variants page uses it', async () => {
    const wrapper = await createTestProvider()

    render(
      <DetailPropertiesPanel
        maxWidth={480}
        testId="variant-detail-definition"
        sections={[{title: 'Conditions', rows: [{label: 'Audience', value: 'Loyal customers'}]}]}
      />,
      {wrapper},
    )

    const panel = screen.getByTestId('variant-detail-definition')
    expect(panel.textContent).toBe('ConditionsAudienceLoyal customers')
    expect(within(panel).queryByRole('button')).toBeNull()
  })

  it('renders a footer under the sections when one is passed', async () => {
    const wrapper = await createTestProvider()

    render(
      <DetailPropertiesPanel
        testId="release-detail-metadata"
        sections={[{rows: [{label: 'Status', value: 'Valid'}]}]}
        footer={<button type="button">Show fewer</button>}
      />,
      {wrapper},
    )

    const panel = screen.getByTestId('release-detail-metadata')
    expect(panel.textContent).toBe('StatusValidShow fewer')
  })
})
