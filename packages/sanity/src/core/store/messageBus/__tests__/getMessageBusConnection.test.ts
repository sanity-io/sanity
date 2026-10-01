import {assert, describe, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {getMessageBusConnection, resetMessageBusConnection} from '../getMessageBusConnection'

describe('getMessageBusConnection', () => {
  it('connects once a host installs a bus, even after a call without one', async () => {
    expect(getMessageBusConnection()).toBeUndefined()

    const host = stubMessageBusHost()
    host.publish('auth.token', 'token')

    expect(await getMessageBusConnection()?.query('auth.token')).toBe('token')
  })

  it('returns the same connection on repeated calls', () => {
    stubMessageBusHost()
    const connection = getMessageBusConnection()

    expect(connection).toBeDefined()
    expect(getMessageBusConnection()).toBe(connection)
  })

  it('disconnects the connection on reset and connects again on the next call', async () => {
    stubMessageBusHost()
    const connection = getMessageBusConnection()
    assert(connection)

    resetMessageBusConnection()

    expect(getMessageBusConnection()).not.toBe(connection)
    await expect(connection.query('auth.token')).rejects.toThrow('ABORTED')
  })
})
