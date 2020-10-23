import {useObservable} from '@sanity/react-hooks'
import {timer} from 'rxjs'
import {map} from 'rxjs/operators'

export default function ObservableAction(docInfo) {
  return useObservable(
    timer(0, 1000).pipe(
      map((n) => ({
        label: n % 2 === 0 ? 'Tick' : 'Tack',
      }))
    )
  )
}
