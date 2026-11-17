import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {reloadStudio} from '../reloadStudio'

const reload = vi.fn()

beforeEach(() => {
  vi.stubGlobal('location', {reload})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('reloadStudio', () => {
  it('reloads the page without a message bus host', () => {
    reloadStudio()

    expect(reload).toHaveBeenCalledOnce()
  })

  it('asks the message bus host to reload Studio instead of reloading the page', async () => {
    const host = stubMessageBusHost()
    let requests = 0
    host.respond('applications.reload', (message) => {
      requests += 1
      message.reply({ok: true})
    })

    reloadStudio()

    await vi.waitFor(() => expect(requests).toBe(1))
    // Replies are delivered in microtasks, so a macrotask runs after the reply is handled.
    await new Promise((resolve) => setTimeout(resolve))
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads the page when the host declines', async () => {
    const host = stubMessageBusHost()
    host.respond('applications.reload', (message) =>
      message.reply({ok: false, reason: 'unsupported'}),
    )

    reloadStudio()

    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce())
  })

  it('reloads the page when nothing on the host answers', async () => {
    stubMessageBusHost()

    reloadStudio()

    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce())
  })
})
