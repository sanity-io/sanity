import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../config/defineConfig'
import {FeedbackDialog} from '../components/FeedbackDialog'

vi.mock('../feedbackClient', () => ({
  sendFeedbackToSentry: vi.fn(),
  FEEDBACK_TUNNEL_URL: 'https://api.sanity.io/intake/feedback',
}))

const config = defineConfig({projectId: 'test', dataset: 'test'})

async function createWrapper() {
  const wrapper = await createTestProvider({config, resources: []})
  return ({children}: {children: ReactNode}) => wrapper({children: <>{children}</>})
}

const defaultProps = {
  onClose: vi.fn(),
  dsn: 'https://key@sentry.sanity.io/123',
  feedbackVersion: '1',
  source: 'test',
}

describe('FeedbackDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('associates the message label with the textarea via htmlFor', async () => {
    const wrapper = await createWrapper()
    render(<FeedbackDialog {...defaultProps} />, {wrapper})

    const textarea = screen.getByLabelText('What is working? What could be better?')
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('associates the consent label with the switch via htmlFor', async () => {
    const wrapper = await createWrapper()
    render(<FeedbackDialog {...defaultProps} userName="Ada" userEmail="ada@example.com" />, {
      wrapper,
    })

    await userEvent.type(
      screen.getByLabelText('What is working? What could be better?'),
      'Some feedback',
    )

    const consentSwitch = screen.getByLabelText('Can we follow up with you about this feedback?')
    expect(consentSwitch.tagName).toBe('INPUT')
    expect(consentSwitch).toHaveAttribute('type', 'checkbox')
  })
})
