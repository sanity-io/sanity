// @flow
interface ObserverI<T> {
  next: T => void;
  complete: () => void;
  error: (error: Error) => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

type FunctionSubscriber<T> = T => any

type ObjectSubscriber<T> = {
  next?: T => void,
  error?: (error: Error) => void,
  complete?: () => void
}

type Subscriber<T> = FunctionSubscriber<T> | ObjectSubscriber<T>

export interface ObservableI<T> {
  constructor: (observer: ObserverI<T>) => void;
  subscribe: (subscriber: Subscriber<T>) => Subscription;
  map<T, A>((T) => A): ObservableI<A>;
}
