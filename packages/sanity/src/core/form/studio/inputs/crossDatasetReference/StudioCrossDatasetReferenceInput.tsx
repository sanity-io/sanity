import React, {useCallback, useMemo, useRef} from 'react'
import {
  CrossDatasetReferenceSchemaType,
  CrossDatasetReferenceValue,
  Path,
  ReferenceFilterOptions,
  ReferenceFilterSearchOptions,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {ObjectInputProps} from '../../../types'
import {Source} from '../../../../config'
import {useSource} from '../../../../studio'
import {useDocumentPreviewStore} from '../../../../store'
import {FIXME} from '../../../../FIXME'
import {useFormValue} from '../../../contexts/FormValue'
import {search} from './datastores/search'
import {createGetReferenceInfo} from './datastores/getReferenceInfo'

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
  ref.current = value
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

  const crossDatasetClient = useMemo(() => {
    return (
      client
        .withConfig({
          dataset: schemaType.dataset,
          apiVersion: '2022-03-07',
          ignoreBrowserTokenWarning: true,
        })

        // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
        .clone()
    )
  }, [client, schemaType.dataset])

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

    [crossDatasetClient, documentRef, path, schemaType, getClient],
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
