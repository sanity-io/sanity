import {
  type GlobalDocumentReferenceSchemaType,
  type GlobalDocumentReferenceValue,
  type Path,
  type ReferenceFilterOptions,
  type ReferenceFilterSearchOptions,
  type SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'

import {type Source} from '../../../../config'
import {type FIXME} from '../../../../FIXME'
import {useSource} from '../../../../studio'
import {useFormValue} from '../../../contexts/FormValue'
import {GlobalDocumentReferenceInput} from '../../../inputs/GlobalDocumentReferenceInput'
import {type ObjectInputProps} from '../../../types'
import {getReferenceClient} from './datastores/getReferenceClient'
import {createGetReferenceInfo} from './datastores/getReferenceInfo'
import {search} from './datastores/search'

async function resolveUserDefinedFilter(
  options: ReferenceFilterOptions | undefined,
  document: SanityDocument,
  valuePath: Path,
  getClient: Source['getClient'],
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    const resolvedFilter = await options.filter({document, parentPath, parent, getClient})
    return resolvedFilter
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

/**
 *
 * @hidden
 * @beta
 */
export type StudioGlobalDocumentReferenceInputProps = ObjectInputProps<
  GlobalDocumentReferenceValue,
  GlobalDocumentReferenceSchemaType
>

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}

/**
 *
 * @hidden
 * @beta
 */
export function StudioGlobalDocumentReferenceInput(
  props: StudioGlobalDocumentReferenceInputProps,
): React.JSX.Element {
  const {path, schemaType} = props
  const source = useSource()
  const client = source.getClient({
    apiVersion: '2023-11-13',
  })
  const getClient = source.getClient
  const {strategy: searchStrategy} = source.search

  const referenceClient = useMemo(
    () => getReferenceClient(client, schemaType),
    [client, schemaType],
  )
  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(schemaType.options, documentRef.current, path, getClient)).pipe(
        mergeMap(({filter, params}) =>
          search(referenceClient, searchString, schemaType, {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.global-document-reference',
            strategy: searchStrategy,
          }),
        ),

        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        }),
      ),

    [schemaType, documentRef, path, getClient, referenceClient, searchStrategy],
  )

  const getReferenceInfo = useMemo(
    () => createGetReferenceInfo({client: referenceClient}),
    [referenceClient],
  )

  return (
    <GlobalDocumentReferenceInput
      {...props}
      getReferenceInfo={getReferenceInfo}
      onSearch={handleSearch}
    />
  )
}
