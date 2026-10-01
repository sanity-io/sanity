import {isDashboardEnvironment} from '@sanity/sdk/_internal'
import {connectMessageBus} from '@sanity/sdk/dashboard'
import {assert, beforeEach, describe, expect, it, onTestFinished} from 'vitest'

import {getMessageBusConnection} from '../../src/core/store/messageBus/getMessageBusConnection'
import {stubMessageBusHost} from './stubMessageBusHost'

describe('stubMessageBusHost', () => {
  it('publishes the latest state to connections that open later', async () => {
    const host = stubMessageBusHost()
    const early = connectMessageBus()
    assert(early)
    host.publish('auth.token', 'first')
    host.publish('auth.token', 'second')

    expect(await early.query('auth.token')).toBe('second')
    expect(await connectMessageBus()?.query('auth.token')).toBe('second')
  })

  it('captures and answers event topics', async () => {
    const host = stubMessageBusHost()
    const updates = host.capture('applications.context.update')
    host.respond('navigation.location.update', (message) => message.reply({ok: true}))
    const connection = connectMessageBus()
    assert(connection)

    void connection.emit('applications.context.update', null)
    const reply = await connection.emit('navigation.location.update', {url: '/'})

    expect(updates).toEqual([null])
    expect(reply).toEqual({ok: true})
  })

  it('uninstalls the bus when the test finishes', () => {
    // Finish handlers run in reverse, so this one runs after the host's teardown.
    onTestFinished(() => {
      expect(isDashboardEnvironment()).toBe(false)
    })
    stubMessageBusHost()
    expect(isDashboardEnvironment()).toBe(true)
  })

  it('drops the Studio connection when the test finishes', () => {
    onTestFinished(() => {
      expect(getMessageBusConnection()).toBeUndefined()
    })
    stubMessageBusHost()
    expect(getMessageBusConnection()).toBeDefined()
  })

  describe('when called from a beforeEach', () => {
    beforeEach(() => {
      stubMessageBusHost()
    })

    it('installs the bus for the test', () => {
      expect(isDashboardEnvironment()).toBe(true)
    })
  })

  // Runs after the describe above to check what its beforeEach left behind.
  it('leaves no bus behind after a beforeEach install', () => {
    expect(isDashboardEnvironment()).toBe(false)
  })
})
