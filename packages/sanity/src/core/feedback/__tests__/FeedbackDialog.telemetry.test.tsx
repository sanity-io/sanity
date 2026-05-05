import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../config/defineConfig'
import {FeedbackDialogDismissed} from '../__telemetry__/feedback.telemetry'
import {FeedbackDialog} from '../components/FeedbackDialog'

const mockLog = vi.fn()
vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockLog})),
}))

vi.mock('../feedbackClient', () => ({
  sendFeedbackToSentry: vi.fn(() => Promise.resolve()),
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

describe('FeedbackDialog dismiss telemetry', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs `Feedback Dialog Dismissed` when the Cancel button is clicked', async () => {
    const wrapper = await createWrapper()
    render(<FeedbackDialog {...defaultProps} />, {wrapper})

    await userEvent.click(screen.getByRole('button', {name: /^cancel$/i}))

    expect(mockLog).toHaveBeenCalledWith(FeedbackDialogDismissed)
  })

  it('does not log `Feedback Dialog Dismissed` when feedback was successfully submitted', async () => {
    const wrapper = await createWrapper()
    render(<FeedbackDialog {...defaultProps} />, {wrapper})

    await userEvent.click(screen.getByRole('button', {name: /^easy$/i}))
    await userEvent.type(
      screen.getByLabelText('What is working? What could be better?'),
      'Looks great',
    )
    await userEvent.click(screen.getByRole('button', {name: /send feedback/i}))

    expect(mockLog).not.toHaveBeenCalledWith(FeedbackDialogDismissed)
  })
})
