import {Subscriber} from 'nano-pubsub'

/** @internal */
export type Reported<Value> = [string, Value]

/** @internal */
export interface TrackerContext<Value> {
  add: (id: string, value: Value) => void
  update: (id: string, value: Value) => void
  remove: (id: string) => void
  read: () => Reported<Value>[]
  subscribe: (subscriber: Subscriber<Reported<Value>[]>) => () => void
}
