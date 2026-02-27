import {type ComponentType, lazy} from 'react'
import {delay, firstValueFrom, from} from 'rxjs'
import {type InputProps} from 'sanity'

export const LazyInputB = lazy<ComponentType<InputProps>>(() =>
  firstValueFrom(from(import('./InputB')).pipe(delay(8_000))),
)
