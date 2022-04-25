import React, {ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'
import {
  CrossDatasetReference,
  CrossDatasetReferenceSchemaType,
  Path,
  ReferenceFilterOptions,
  ReferenceFilterSearchOptions,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import {Box, Stack, Text, TextSkeleton} from '@sanity/ui'
import {withValuePath} from '../../../utils/withValuePath'
import {withDocument} from '../../../utils/withDocument'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {Alert} from '../../../components/Alert'
import {useSource} from '../../../../studio'
import {useDocumentPreviewStore} from '../../../../datastores'
import {ObjectFieldProps} from '../../../store/types'
import {search} from './datastores/search'
import {createGetReferenceInfo} from './datastores/getReferenceInfo'
import {useCrossProjectToken} from './datastores/useCrossProjectToken'

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

export interface SanityCrossDatasetReferenceInputProps
  extends ObjectFieldProps<CrossDatasetReference, CrossDatasetReferenceSchemaType> {
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
  props: SanityCrossDatasetReferenceInputProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document} = props
  const {client, projectId} = useSource()
  const documentPreviewStore = useDocumentPreviewStore()

  const isCurrentProject = projectId === type.projectId
  const loadableToken = useCrossProjectToken(client, {
    projectId: type.projectId,
    tokenId: type.tokenId,
  })

  const crossDatasetClient = useMemo(() => {
    const token = isCurrentProject
      ? undefined
      : loadableToken?.status === 'loaded' && loadableToken.result

    return (
      client
        .withConfig({
          projectId: type.projectId,
          dataset: type.dataset,
          apiVersion: '2022-03-07',
          token: token || undefined,
          ignoreBrowserTokenWarning: true,
        })

        // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
        .clone()
    )
  }, [client, isCurrentProject, loadableToken, type.projectId, type.dataset])

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

  const getReferenceInfo = useMemo(
    () => createGetReferenceInfo({client: crossDatasetClient, documentPreviewStore}),
    [crossDatasetClient, documentPreviewStore]
  )

  if (loadableToken?.status === 'loading') {
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

  if (!isCurrentProject && loadableToken?.status === 'loaded' && !loadableToken.result) {
    return (
      <Stack space={2} marginY={2}>
        <Text size={1} weight="semibold">
          {type.title}
        </Text>
        <Alert title="No cross dataset read token found" size={1} muted>
          <Stack space={3}>
            <Text size={1}>
              This cross dataset reference field requires a cross dataset token to be registered.
              Please configure a token{' '}
              {type.tokenId ? (
                <>
                  with ID <b>{type.tokenId}</b>
                </>
              ) : null}{' '}
              for project <b>{type.projectId}</b> that has read access to the <b>{type.dataset}</b>
              -dataset.
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
      getReferenceInfo={getReferenceInfo}
      ref={ref}
    />
  )
})

export default withValuePath(withDocument(SanityCrossDatasetReferenceInput))
