import {beforeEach} from 'node:test'

import {test} from '@jest/globals'
import {of} from 'rxjs'
import {delay} from 'rxjs/operators'

import {checkoutPair, type DocumentVersionEvent} from './checkoutPair'

const draftEventsLog: DocumentVersionEvent[] = []
const publishedEventsLog: DocumentVersionEvent[] = []

beforeEach(() => {
  draftEventsLog.length = 0
  publishedEventsLog.length = 0
})

test('patch', async () => {
  const client = {
    observable: {
      // request: jest.fn(),
      //TODO: make some listener events and some logic (when do we hit "welcome", ec)
      listen: () => of({type: 'welcome'}).pipe(delay(0)),
      getDocuments: (ids: string[]) =>
        of([
          {_id: ids[0], _type: 'any', _rev: 'any'},
          {_id: ids[1], _type: 'any', _rev: 'any'},
        ]),
    },
    // dataRequest: jest.fn()
  }
  const idPair = {publishedId: 'publishedId', draftId: 'draftId'}
  const submitRequest = () => {
    // console.log('submitRequest')
  }

  const {draft, published} = checkoutPair(client as any, idPair, submitRequest as any)
  draft.events.subscribe((ev) => draftEventsLog.push(ev))
  published.events.subscribe((ev) => publishedEventsLog.push(ev))

  await new Promise((resolve) => setTimeout(resolve, 1000))
  const patchObj = {set: {title: 'new title'}}
  draft.patch([patchObj])
  draft.commit()
  // console.log(draftEventsLog)
})
