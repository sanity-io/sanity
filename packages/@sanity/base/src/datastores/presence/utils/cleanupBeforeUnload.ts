import {MonoTypeOperatorFunction, Observable} from 'rxjs'

export function doBeforeUnload<T>(cleanup: () => void): MonoTypeOperatorFunction<T> {
  return (input$) =>
    new Observable((subscriber) => {
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
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
