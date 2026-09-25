import {firstValueFrom, take, toArray} from 'rxjs'
import {assert, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {observeWorkbenchToken, refreshWorkbenchToken} from '../workbenchToken'

it('is undefined and a no-op without a message bus host', () => {
  expect(observeWorkbenchToken()).toBeUndefined()
  expect(() => refreshWorkbenchToken()).not.toThrow()
})

it('follows the token as the host changes it', async () => {
  const host = stubMessageBusHost()
  host.publish('auth.token', 'first')
  const token$ = observeWorkbenchToken()
  assert(token$)

  const tokens = firstValueFrom(token$.pipe(take(3), toArray()))
  host.publish('auth.token', null)
  host.publish('auth.token', 'second')

  expect(await tokens).toEqual(['first', null, 'second'])
})

it('asks the host to reissue the token', () => {
  const host = stubMessageBusHost()
  let requests = 0
  host.respond('auth.token.refresh', (message) => {
    requests += 1
    message.reply('reissued')
  })

  refreshWorkbenchToken()

  expect(requests).toBe(1)
})
