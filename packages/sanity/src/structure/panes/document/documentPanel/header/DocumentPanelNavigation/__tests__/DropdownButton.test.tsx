import {DotIcon} from '@sanity/icons/Dot'
import {render, screen} from '@testing-library/react'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {DropdownButton} from '../DropdownButton'

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('DropdownButton', () => {
  it('cuts a long label at 32 characters, like the navbar chips, and keeps its full name', () => {
    const longTitle =
      "This release title is just so obscenely long. It's basically like a novel by this point"
    render(<DropdownButton data-testid="pill" icon={DotIcon} text={longTitle} />, {wrapper})

    const trigger = screen.getByTestId('pill')
    expect(trigger).toHaveTextContent('This release title is just so ob…')
    expect(trigger).toHaveAccessibleName(longTitle)
  })

  it('marks the pill as having a selection, which squares the trigger against its ×, also when the label is cut', () => {
    const longTitle = 'Spanish Festival: peru / photographers / spring'
    render(
      <DropdownButton data-testid="pill" icon={DotIcon} onClear={() => {}} text={longTitle} />,
      {wrapper},
    )

    const pill = screen.getByTestId('pill').closest('[data-ui="DropdownButton"]')
    expect(pill).toHaveAttribute('data-has-selection')
    expect(screen.getByTestId('dropdown-button-clear')).toBeInTheDocument()
  })

  it('keeps the same trigger when the label becomes cut, so the trigger does not lose focus', () => {
    const {rerender} = render(
      <DropdownButton data-testid="pill" icon={DotIcon} text="Releases" />,
      {
        wrapper,
      },
    )
    const trigger = screen.getByTestId('pill')

    rerender(
      <DropdownButton
        data-testid="pill"
        icon={DotIcon}
        text="Spanish Festival: peru / photographers / spring"
      />,
    )

    expect(screen.getByTestId('pill')).toBe(trigger)
  })

  it('shows a short label in full', () => {
    render(<DropdownButton data-testid="pill" icon={DotIcon} text="Winter sale" />, {wrapper})

    expect(screen.getByTestId('pill')).toHaveTextContent('Winter sale')
  })
})
