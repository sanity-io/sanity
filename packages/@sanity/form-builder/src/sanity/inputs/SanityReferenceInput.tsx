import React, {ForwardedRef, forwardRef, useCallback, useRef} from 'react'

import {
  Marker,
  Path,
  Reference,
  ReferenceFilterSearchOptions,
  ReferenceOptions,
  ReferenceSchemaType,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import {ReferenceInput} from '../../inputs/ReferenceInput'
import PatchEvent from '../../PatchEvent'
import withValuePath from '../../utils/withValuePath'
import withDocument from '../../utils/withDocument'
import * as adapter from './client-adapters/reference'

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceOptions | undefined,
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
  value?: Reference
  compareValue?: Reference
  type: ReferenceSchemaType
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

const SanityReferenceInput = forwardRef(function SanityReferenceInput(
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document} = props

  const documentRef = useValueRef(document)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(type.options, documentRef.current, getValuePath())).pipe(
        mergeMap(({filter, params}) =>
          adapter.search(searchString, type, {
            ...type.options,
            filter,
            params,
            tag: 'search.reference',
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
    [documentRef, getValuePath, type]
  )

  const getPreviewSnapshot = useCallback(
    (value: Reference) => adapter.getPreviewSnapshot(value, type),
    [type]
  )

  return (
    <ReferenceInput
      {...props}
      onSearch={handleSearch}
      getPreviewSnapshot={getPreviewSnapshot}
      ref={ref}
    />
  )
})

export default withValuePath(withDocument(SanityReferenceInput))
