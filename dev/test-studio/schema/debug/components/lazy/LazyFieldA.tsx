import {type ComponentType, lazy} from 'react'
import {delay, firstValueFrom, from} from 'rxjs'
import {type FieldProps} from 'sanity'

export const LazyFieldA = lazy<ComponentType<FieldProps>>(() =>
  firstValueFrom(from(import('./FieldA')).pipe(delay(8_000))),
)
