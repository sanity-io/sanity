import {Observable} from 'rxjs'

export interface Payload<T> {
  identity: string
  timestamp: string
  message: T
}

export type Transport<T> = [Observable<Payload<T>>, (messages: T[]) => Promise<void>]
