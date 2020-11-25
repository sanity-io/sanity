import {Reported} from './index'
export declare function createStore<Value>(): {
  add: (id: string, value: Value) => void
  remove: (id: string) => void
  update: (id: string, value: Value) => void
  read: () => [string, Value][]
  subscribe: (subscriber: import('nano-pubsub').Subscriber<Reported<Value>[]>) => () => void
}
