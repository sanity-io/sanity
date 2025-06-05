import {type ComponentType, lazy} from 'react'
import {delay, firstValueFrom, from} from 'rxjs'
import {type InputProps} from 'sanity'

export const LazyInputA = lazy<ComponentType<InputProps>>(() =>
  firstValueFrom(from(import('./InputA')).pipe(delay(8_000))),
)
