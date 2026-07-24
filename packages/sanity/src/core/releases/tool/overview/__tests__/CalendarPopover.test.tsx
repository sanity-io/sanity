import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {CalendarPopover} from '../CalendarPopover'

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
})

const TRIGGER_LABEL = 'View calendar'

describe('CalendarPopover', () => {
  it('renders a trigger button and keeps the popover closed by default', async () => {
    render(<CalendarPopover content={<div>calendar content</div>} />, {wrapper})

    const trigger = await screen.findByRole('button', {name: TRIGGER_LABEL})
    expect(trigger).toBeInTheDocument()
    expect(screen.queryByText('calendar content')).not.toBeInTheDocument()
  })

  it('opens the popover content when the trigger is clicked and the trigger stays anchored', async () => {
    render(<CalendarPopover content={<div>calendar content</div>} />, {wrapper})

    const trigger = await screen.findByRole('button', {name: TRIGGER_LABEL})
    await userEvent.click(trigger)

    expect(await screen.findByText('calendar content')).toBeInTheDocument()
    // The popover's reference element must resolve to the trigger button itself
    // (not an intermediate wrapper), otherwise floating-ui can't compute a position
    // and the popover renders detached at the viewport origin.
    expect(trigger.tagName).toBe('BUTTON')
  })

  it('closes the popover when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <CalendarPopover content={<div>calendar content</div>} />
      </div>,
      {wrapper},
    )

    const trigger = await screen.findByRole('button', {name: TRIGGER_LABEL})
    await userEvent.click(trigger)
    expect(await screen.findByText('calendar content')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(screen.queryByText('calendar content')).not.toBeInTheDocument()
    })
  })

  it('toggles closed when clicking the trigger again', async () => {
    render(<CalendarPopover content={<div>calendar content</div>} />, {wrapper})

    const trigger = await screen.findByRole('button', {name: TRIGGER_LABEL})
    await userEvent.click(trigger)
    expect(await screen.findByText('calendar content')).toBeInTheDocument()

    await userEvent.click(trigger)

    await waitFor(() => {
      expect(screen.queryByText('calendar content')).not.toBeInTheDocument()
    })
  })
})
