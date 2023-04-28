import {useMemo} from 'react'
import {FetchProps, Loadable, useFetch} from './useFetch'

type Value = string[] | null

/**
 * @internal
 * Returns the document type names that match a given filter
 */
export function useDocumentTypeNames(props: FetchProps): Loadable<Value> {
  const {params, filter: filterProp, disabled} = props

  const filter = useMemo(() => {
    return `array::unique(*[${filterProp}][]._type)`
  }, [filterProp])

  const value = useFetch<Value>({filter, params, disabled})

  return value
}
