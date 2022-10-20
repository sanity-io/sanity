import {FormFieldPresence} from '@sanity/base/presence'
import {
  CrossDatasetReference,
  CrossDatasetReferenceSchemaType,
  Marker,
  Path,
  ReferenceFilterOptions,
  ReferenceFilterSearchOptions,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import client from 'part:@sanity/base/client'
import React, {ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'

import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import PatchEvent from '../../../PatchEvent'
import withDocument from '../../../utils/withDocument'
import withValuePath from '../../../utils/withValuePath'
import {createGetReferenceInfo} from './datastores/getReferenceInfo'
import {search} from './datastores/search'

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceFilterOptions | undefined,
  document: SanityDocument,
  valuePath: Path
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    return options.filter({document, parentPath, parent})
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

export type Props = {
  value?: CrossDatasetReference
  compareValue?: CrossDatasetReference
  type: CrossDatasetReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]

  // From withDocument
  document: SanityDocument

  // From withValuePath
  getValuePath: () => Path
}

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

const SanityCrossDatasetReferenceInput = forwardRef(function SanityCrossDatasetReferenceInput(
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document} = props

  const crossDatasetClient = useMemo(() => {
    return (
      client
        .withConfig({
          dataset: type.dataset,
          apiVersion: '2022-03-07',
          ignoreBrowserTokenWarning: true,
        })
        // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
        .clone()
    )
  }, [type.dataset])

  const documentRef = useValueRef(document)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(type.options, documentRef.current, getValuePath())).pipe(
        mergeMap(({filter, params}) =>
          search(crossDatasetClient, searchString, type, {
            ...type.options,
            filter,
            params,
            tag: 'search.cross-dataset-reference',
          })
        ),
        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (type.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),
    [crossDatasetClient, documentRef, getValuePath, type]
  )

  const getReferenceInfo = useMemo(() => createGetReferenceInfo(crossDatasetClient), [
    crossDatasetClient,
  ])

  return (
    <CrossDatasetReferenceInput
      {...props}
      onSearch={handleSearch}
      getReferenceInfo={getReferenceInfo}
      ref={ref}
    />
  )
})

export default withValuePath(withDocument(SanityCrossDatasetReferenceInput))
