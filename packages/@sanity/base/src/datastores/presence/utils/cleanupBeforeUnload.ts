import {MonoTypeOperatorFunction, Observable} from 'rxjs'

export function doBeforeUnload<T>(cleanup): MonoTypeOperatorFunction<T> {
  return input$ =>
    new Observable(subscriber => {
      const onBeforeUnload = event => {
        cleanup()
        delete event.returnValue
      }
      window.addEventListener('beforeunload', onBeforeUnload)

      const subscription = input$.subscribe(subscriber)
      return () => {
        subscription.unsubscribe()
        window.removeEventListener('beforeunload', onBeforeUnload)
      }
    })
}
