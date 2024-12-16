import {
  type CrossDatasetReferenceSchemaType,
  type CrossDatasetReferenceValue,
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
import {useDocumentPreviewStore} from '../../../../store'
import {useSource} from '../../../../studio'
import {useSearchMaxFieldDepth} from '../../../../studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {useFormValue} from '../../../contexts/FormValue'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {type ObjectInputProps} from '../../../types'
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
export type StudioCrossDatasetReferenceInputProps = ObjectInputProps<
  CrossDatasetReferenceValue,
  CrossDatasetReferenceSchemaType
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
export function StudioCrossDatasetReferenceInput(props: StudioCrossDatasetReferenceInputProps) {
  const {path, schemaType} = props
  const source = useSource()
  const client = source.getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentPreviewStore = useDocumentPreviewStore()
  const getClient = source.getClient
  const {strategy: searchStrategy} = source.search

  const crossDatasetClient = useMemo(() => {
    return (
      client
        .withConfig({
          dataset: schemaType.dataset,
          apiVersion: '2023-11-13',
          ignoreBrowserTokenWarning: true,
        })

        // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
        .clone()
    )
  }, [client, schemaType.dataset])
  const maxFieldDepth = useSearchMaxFieldDepth(crossDatasetClient)
  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(schemaType.options, documentRef.current, path, getClient)).pipe(
        mergeMap(({filter, params}) =>
          search(crossDatasetClient, searchString, schemaType, {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.cross-dataset-reference',
            maxFieldDepth,
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

    [schemaType, documentRef, path, getClient, crossDatasetClient, maxFieldDepth, searchStrategy],
  )

  const getReferenceInfo = useMemo(
    () => createGetReferenceInfo({client: crossDatasetClient, documentPreviewStore}),
    [crossDatasetClient, documentPreviewStore],
  )

  return (
    <CrossDatasetReferenceInput
      {...props}
      getReferenceInfo={getReferenceInfo}
      onSearch={handleSearch}
    />
  )
}
