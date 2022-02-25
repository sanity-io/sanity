import config from 'config:sanity'
import {fromEvent, of} from 'rxjs'
import {filter, map} from 'rxjs/operators'

// Support various studios with different projectIds to have their own exclusive message stream
const getLSKey = () => {
  return `__studio_local_storage_messaging_${config.api.projectId}`
}

const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

const storageEvents$ =
  typeof window === 'undefined'
    ? of<StorageEvent>() // No storage events in non-browser environments
    : fromEvent<StorageEvent>(window, 'storage')

export const otherWindowMessages$ = storageEvents$.pipe(
  filter((event) => event.key === getLSKey()),
  map((event) => event.newValue),
  filter(isNonNullable),
  map((newValue) => JSON.parse(newValue))
)

export const crossWindowBroadcast = (message: unknown): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(getLSKey(), JSON.stringify(message))
    // clear the value afterwards so that next message will still emit a
    // new event even if it's identical to the previous one
    window.localStorage.removeItem(getLSKey())
  } catch (err) {
    // intentional noop
  }
}
