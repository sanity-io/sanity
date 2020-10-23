import {Doc, DocumentRemoteMutationVersionEvent, TransactionLogEvent} from './types'
import {Timeline} from './timeline'

export type TraceEvent =
  | {
      type: 'initial'
      publishedId: string
    }
  | {type: 'addRemoteMutation'; event: DocumentRemoteMutationVersionEvent}
  | {type: 'addTranslogEntry'; event: TransactionLogEvent}
  | {type: 'didReachEarliestEntry'}
  | {type: 'updateChunks'}

export function replay(events: TraceEvent[]): Timeline {
  const fst = events[0]
  if (fst?.type !== 'initial') throw new Error('no initial event')

  const timeline = new Timeline({
    publishedId: fst.publishedId,
  })

  console.log('Replaying')
  console.log({events})

  for (let i = 1; i < events.length; i++) {
    const event = events[i]

    switch (event.type) {
      case 'initial':
        throw new Error('unexpected initial event')
      case 'addRemoteMutation':
        timeline.addRemoteMutation(event.event)
        break
      case 'addTranslogEntry':
        timeline.addTranslogEntry(event.event)
        break
      case 'didReachEarliestEntry':
        timeline.didReachEarliestEntry()
        break
      case 'updateChunks':
        timeline.updateChunks()
        break
    }
  }

  return timeline
}
