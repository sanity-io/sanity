import {render, screen} from '@testing-library/react'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

function Header({count}: {count: number}) {
  const {t} = useTranslation()
  return (
    <div data-testid="header">
      {t('document-group.create-variant.variant-section.of-document', {count})}
    </div>
  )
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('variant section header', () => {
  it('names the variants of this document with how many there are', () => {
    const {rerender} = render(<Header count={1} />, {wrapper})
    expect(screen.getByTestId('header').textContent).toBe('Variants of this document (1)')

    rerender(<Header count={9} />)
    expect(screen.getByTestId('header').textContent).toBe('Variants of this document (9)')
  })
})
