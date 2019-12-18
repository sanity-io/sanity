import * as React from 'react'
import {useObservable} from '@sanity/react-hooks'
import {timer} from 'rxjs'
import {map} from 'rxjs/operators'
import {createAction} from 'part:@sanity/base/actions/utils'


export default createAction(props => {
  return useObservable(
    timer(0, 1000).pipe(
      map(n => ({
        label: n % 2 === 0 ? 'Tick' : 'Tack'
      }))
    )
  )
})
