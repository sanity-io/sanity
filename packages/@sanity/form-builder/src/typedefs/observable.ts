interface ObserverI<T> {
  next: (arg0: T) => void
  complete: () => void
  error: (error: Error) => void
}

export interface Subscription {
  unsubscribe: () => void
}

type FunctionSubscriber<T> = (arg0: T) => any

type ObjectSubscriber<T> = {
  next?: (arg0: T) => void
  error?: (error: Error) => void
  complete?: () => void
}

type Subscriber<T> = FunctionSubscriber<T> | ObjectSubscriber<T>

export interface ObservableI<T> {
  constructor: (observer: ObserverI<T>) => void
  subscribe: (subscriber: Subscriber<T>) => Subscription
  map<T, A>(arg0: (arg0: T) => A): ObservableI<A>
}
