import {render, screen} from '@testing-library/react'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

function Header({count}: {count: number}) {
  const {t} = useTranslation()
  return (
    <div data-testid="header">
      {t('document-group.create-variant.variant-section.has-variants', {count})}
    </div>
  )
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('variant section header', () => {
  it('says "Has no variants" for a count of zero, not "Has 0 variants"', () => {
    render(<Header count={0} />, {wrapper})
    expect(screen.getByTestId('header').textContent).toBe('Has no variants')
  })

  it('keeps the one and many forms', () => {
    const {rerender} = render(<Header count={1} />, {wrapper})
    expect(screen.getByTestId('header').textContent).toBe('Has 1 variant')

    rerender(<Header count={2} />)
    expect(screen.getByTestId('header').textContent).toBe('Has 2 variants')
  })
})
