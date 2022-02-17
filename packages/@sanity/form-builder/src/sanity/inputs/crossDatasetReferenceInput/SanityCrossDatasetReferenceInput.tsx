import React, {ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'

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
import {FormFieldPresence} from '@sanity/base/presence'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {Box, Stack, Text, TextSkeleton} from '@sanity/ui'
import withValuePath from '../../../utils/withValuePath'
import withDocument from '../../../utils/withDocument'
import PatchEvent from '../../../PatchEvent'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {versionedClient} from '../../versionedClient'
import {Alert} from '../../../components/Alert'
import {search} from './datastores/search'
import {getReferenceInfo} from './datastores/getReferenceInfo'
import {useCrossDatasetToken} from './datastores/useCrossDatasetToken'

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

  const loadableToken = useCrossDatasetToken(versionedClient, {
    projectId: type.projectId,
    dataset: type.dataset,
    tokenId: type.tokenId,
  })

  const crossDatasetClient = useMemo(() => {
    return loadableToken.status === 'loaded' && loadableToken.result?.token
      ? client
          .withConfig({
            projectId: type.projectId,
            dataset: type.dataset,
            apiVersion: '2022-01-21',
            token: loadableToken.result.token,
          })
          // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
          .clone()
      : null
  }, [loadableToken, type.dataset, type.projectId])

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

  const _getReferenceInfo = useCallback(
    (id: string) => (crossDatasetClient ? getReferenceInfo(crossDatasetClient, type, id) : null),
    [crossDatasetClient, type]
  )

  if (loadableToken.status === 'loading') {
    return (
      <Box padding={2}>
        <Stack space={2}>
          <Stack space={2} padding={1}>
            <TextSkeleton style={{maxWidth: 320}} radius={1} />
            <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} />
          </Stack>
        </Stack>
      </Box>
    )
  }

  if (loadableToken.status === 'loaded' && !loadableToken.result?.token) {
    return (
      <Stack space={2} marginY={2}>
        <Text size={1} weight="semibold">
          {type.title}
        </Text>
        <Alert title="No cross dataset read token found" size={1} muted>
          <Stack space={3}>
            <Text size={1}>
              This cross dataset reference field requires a cross dataset token to be registered.
              Please provide a value for token with id "<b>{type.tokenId}</b>" for dataset "
              <b>{type.dataset}</b>" in project "<b>{type.projectId}</b>".
            </Text>
            <Text size={1}>
              See the documentation for{' '}
              <a href="https://www.sanity.io/docs/cross-dataset-references">
                Cross Dataset References
              </a>{' '}
              for more details.
            </Text>
          </Stack>
        </Alert>
      </Stack>
    )
  }

  return (
    <CrossDatasetReferenceInput
      {...props}
      onSearch={handleSearch}
      getReferenceInfo={_getReferenceInfo}
      ref={ref}
    />
  )
})

export default withValuePath(withDocument(SanityCrossDatasetReferenceInput))
