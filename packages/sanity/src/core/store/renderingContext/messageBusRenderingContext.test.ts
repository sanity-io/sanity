import {assert, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {getMessageBusConnection} from '../messageBus/getMessageBusConnection'
import {messageBusRenderingContext} from './messageBusRenderingContext'

it('passes a resolved rendering context through', async () => {
  stubMessageBusHost()

  await expect(messageBusRenderingContext).toMatchEmissions([
    [
      {name: 'coreUi', metadata: {environment: 'production'}},
      {name: 'coreUi', metadata: {environment: 'production'}},
    ],
  ])
})

it('emits the message bus context if the subject is `undefined` and a host is connected', async () => {
  stubMessageBusHost()
  const connection = getMessageBusConnection()
  assert(connection)

  await expect(messageBusRenderingContext).toMatchEmissions([
    [undefined, {name: 'messageBus', metadata: {connection}}],
  ])
})

it('emits `undefined` without a message bus host', async () => {
  await expect(messageBusRenderingContext).toMatchEmissions([[undefined, undefined]])
})
