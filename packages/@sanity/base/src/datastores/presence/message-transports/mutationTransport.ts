import client from 'part:@sanity/base/client'
import {filter, flatMap} from 'rxjs/operators'
import {has} from 'lodash'
import {Payload, Transport} from './transport'
import {defer, Observable} from 'rxjs'

export const createMutationTransport = <T>(
  channel,
  disconnectMessage: T,
  type = 'messageChannel',
  fieldName = 'messages'
): Transport<T> => {
  const documentId = `presence.meta.${channel}`
  const messages$ = defer(
    (): Observable<any> => client.listen('*[_id == $id]', {id: documentId}, {includeResult: false})
  ).pipe(
    filter(event => event.type === 'mutation'),
    flatMap((mutationEvent): Payload<T>[] => {
      const {timestamp, identity} = mutationEvent
      const setPatch = mutationEvent.mutations.filter(mutation =>
        has(mutation, ['patch', 'set', fieldName])
      )
      return setPatch
        .flatMap(mutation => mutation.patch && mutation.patch && mutation.patch.set.messages)
        .map(message => ({
          message,
          identity,
          timestamp
        }))
    })
  )
  const sendMessages = (messages: T[]): Promise<void> => {
    return client
      .transaction()
      .createIfNotExists({_id: documentId, _type: type})
      .patch(documentId, p => p.set({[fieldName]: messages}))
      .commit()
      .then(() => undefined)
  }

  // no good because of: https://bugs.chromium.org/p/chromium/issues/detail?id=490015
  // const mutateUrl = client.getUrl(client.getDataUrl('mutate'))
  // function disconnect() {
  //   if (CAN_SEND_BEACON) {
  //     const body = {
  //       mutations: [
  //         {createIfNotExists: {_id: documentId, _type: type}},
  //         {
  //           patch: {
  //             id: 'presence-meta-doc',
  //             set: {messages: [getDisconnectMessage()]}
  //           }
  //         }
  //       ]
  //     }
  //     const blob = new Blob([JSON.stringify(body, null, 2)])
  //     sendBeacon(mutateUrl, blob)
  //   }
  // }

  return [messages$, sendMessages]
}
